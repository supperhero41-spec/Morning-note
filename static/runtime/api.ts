// Runs the real app/api route handlers in the browser against an in-memory SQLite copy of the data branch.
// Writes to site_config are committed back to config.json on GitHub.
import initSqlJs,{type Database} from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import schema from '../../drizzle/0000_eager_cassandra_nova.sql?raw';
import {env} from '../shims/cloudflare-workers';
import {createD1} from './d1';
import {readRaw,fileSha,writeText,gunzipText,dispatchScrape,GitHubError,getRepo,getToken} from './github';
import * as dataRoute from '../../app/api/data/route';
import * as settingsRoute from '../../app/api/settings/route';
import * as editorialRoute from '../../app/api/editorial/route';
import {getSettings} from '../../lib/data';
import {configuredAssets} from '../../lib/catalog';
import {updateLiveQuotes,mergeLiveQuotes} from './live-quotes';

type ConfigRow={key:string;value:string};
type CacheRow={key:string;payload:string;attempted_at:number;succeeded_at:number;error:string|null};
const INVALIDATE='cache-invalidate:';
let db:Database,configSha:string|null=null,viewSha:string|null=null;

async function fetchConfig(){
 const [buf,sha]=await Promise.all([readRaw('config.json'),fileSha('config.json')]);
 return {rows:buf?JSON.parse(new TextDecoder().decode(buf)) as ConfigRow[]:[],sha};
}
async function fetchView(){
 const [buf,sha]=await Promise.all([readRaw('view.json.gz'),fileSha('view.json.gz')]);
 return {rows:buf?JSON.parse(await gunzipText(buf)) as CacheRow[]:[],sha};
}
function putConfig(rows:ConfigRow[]){
 db.run('DELETE FROM site_config');
 const s=db.prepare('INSERT OR REPLACE INTO site_config (key,value) VALUES (?,?)');try{for(const r of rows)s.run([r.key,r.value])}finally{s.free()}
}
function putView(rows:CacheRow[]){
 const invalid=new Map(configRows().filter(r=>r.key.startsWith(INVALIDATE)).map(r=>[r.key.slice(INVALIDATE.length),Number(r.value)]));
 db.run('DELETE FROM feed_cache');
 const s=db.prepare('INSERT OR REPLACE INTO feed_cache (key,payload,attempted_at,succeeded_at,error) VALUES (?,?,?,?,?)');
 try{for(const r of rows)if(!(r.attempted_at<(invalid.get(r.key)??-1)))s.run([r.key,r.payload,r.attempted_at,r.succeeded_at,r.error])}finally{s.free()}
}
function configRows():ConfigRow[]{const out:ConfigRow[]=[];const s=db.prepare('SELECT key,value FROM site_config ORDER BY key');try{while(s.step())out.push(s.getAsObject() as ConfigRow)}finally{s.free()}return out}
function cacheKeys(){const out=new Set<string>();const s=db.prepare('SELECT key FROM feed_cache');try{while(s.step())out.add(String(s.get()[0]))}finally{s.free()}return out}
// One row per line keeps git diffs of config.json readable.
const serialize=(rows:ConfigRow[])=>'[\n'+rows.map(r=>JSON.stringify(r)).join(',\n')+'\n]\n';

export type LoadInfo={hasData:boolean;hasConfig:boolean};
export async function load():Promise<LoadInfo>{
 const SQL=await initSqlJs({locateFile:()=>wasmUrl});
 const [config,view]=await Promise.all([fetchConfig(),fetchView()]);
 db=new SQL.Database();db.exec(schema);
 putConfig(config.rows);putView(view.rows);configSha=config.sha;viewSha=view.sha;
 env.DB=createD1(db);
 return {hasData:view.rows.length>0,hasConfig:config.rows.length>0};
}
/** Pull new scraper output (view.json.gz) if it changed. Returns true when reloaded. */
export async function syncView(force=false){
 const sha=await fileSha('view.json.gz');if(!force&&(!sha||sha===viewSha))return false;
 const [view,config]=await Promise.all([fetchView(),fetchConfig()]);
 putConfig(config.rows);configSha=config.sha;putView(view.rows);viewSha=view.sha;return true;
}

// Writes are serialized; on a sha conflict the handler is re-run on the latest config.
let queue:Promise<unknown>=Promise.resolve();
function mutate(run:()=>Promise<Response>,message:string){
 const job=queue.then(async()=>{
  for(let attempt=0;;attempt++){
   const before=configRows(),keysBefore=cacheKeys();
   const res=await run();
   if(!res.ok){putConfig(before);return res}
   const now=Date.now();
   for(const key of keysBefore)if(!cacheKeys().has(key))db.run('INSERT OR REPLACE INTO site_config (key,value) VALUES (?,?)',[INVALIDATE+key,String(now)]);
   const after=configRows();if(serialize(after)===serialize(before))return res;
   try{configSha=await writeText('config.json',serialize(after),configSha,message);return res}
   catch(e){
    putConfig(before);
    if(e instanceof GitHubError&&(e.status===409||e.status===422)&&attempt<2){const fresh=await fetchConfig();putConfig(fresh.rows);configSha=fresh.sha;continue}
    return Response.json({error:'Chưa lưu được lên GitHub: '+(e instanceof Error?e.message:String(e))},{status:502});
   }
  }
 });
 queue=job.catch(()=>{});return job as Promise<Response>;
}

async function route(path:string,init:RequestInit|undefined):Promise<Response>{
 const method=(init?.method||'GET').toUpperCase(),body=typeof init?.body==='string'?init.body:undefined;
 // Browsers drop a hand-set Origin on Request, but the handlers check it; a plain Headers object may carry it.
 const req=()=>{const r=new Request(location.origin+path,{method,headers:{'Content-Type':'application/json'},body});Object.defineProperty(r,'headers',{value:new Headers({'Content-Type':'application/json',Origin:location.origin})});return r};
 if(path==='/api/data'&&method==='GET'){const res=await dataRoute.GET();if(!res.ok)return res;return Response.json(mergeLiveQuotes((await res.json()) as any),{headers:{'Cache-Control':'no-store'}})}
 if(path==='/api/settings'&&method==='GET')return settingsRoute.GET();
 if(path==='/api/settings'&&method==='PUT')return mutate(()=>settingsRoute.PUT(req()),'Cập nhật cấu hình nguồn/chỉ số');
 if(path==='/api/editorial'&&method==='POST'){let action='';try{action=JSON.parse(body||'{}').action||''}catch{}return mutate(()=>editorialRoute.POST(req()),'Admin: '+(action||'chỉnh tin'))}
 if(path==='/api/refresh')return Response.json({error:'Dùng nút Cập nhật để GitHub cào tin.'},{status:400});
 return Response.json({error:'Không có API này trên bản GitHub Pages'},{status:404});
}

export function installFetchShim(){
 const original=window.fetch.bind(window);
 window.fetch=(input:RequestInfo|URL,init?:RequestInit)=>{
  const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  if(typeof url==='string'&&url.startsWith('/api/'))return route(url.split('?')[0],init);
  return original(input as any,init);
 };
}

/** Manual "Cập nhật": run the scrape workflow, wait for new data, reload it. */
export async function refreshViaGitHub(progress:(text:string)=>void){
 const repo=getRepo(),token=getToken(),started=Date.now();
 const before=await fileSha('view.json.gz');
 await dispatchScrape();
 progress('GitHub đang cào tin (thường 3–6 phút)…');
 const runsUrl='https://api.github.com/repos/'+repo+'/actions/workflows/update-data.yml/runs?per_page=5&event=workflow_dispatch';
 while(Date.now()-started<25*60000){
  await new Promise(r=>setTimeout(r,10000));
  const sha=await fileSha('view.json.gz');
  if(sha&&sha!==before){progress('Đang tải dữ liệu mới…');await syncView(true);return}
  try{
   const runs:any=await (await fetch(runsUrl,{cache:'no-store',headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'}})).json();
   const run=(runs.workflow_runs||[]).find((r:any)=>Date.parse(r.created_at)>=started-60000);
   if(run?.status==='completed'&&run.conclusion!=='success'){
    if(await fileSha('view.json.gz')!==before){await syncView(true);return}
    throw new Error('Lượt cào tin trên GitHub thất bại ('+run.conclusion+'). Xem log: '+run.html_url);
   }
   const mins=Math.floor((Date.now()-started)/60000);
   const state=!run?'':run.status==='queued'?' · đang chờ máy':' · đang chạy';
   progress('GitHub đang cào tin'+state+' · '+mins+' phút…');
  }catch(e){if(e instanceof Error&&e.message.startsWith('Lượt cào'))throw e}
 }
 throw new Error('Quá 25 phút chưa có dữ liệu mới. Xem tab Actions trên GitHub.');
}

/** Browser-side quotes: refresh now, then every minute while the tab is visible. */
export async function startLiveQuotes(){
 const tick=async()=>{try{const settings=await getSettings(env);await updateLiveQuotes(configuredAssets(settings),settings.hiddenAssets)}catch{}};
 await Promise.race([tick(),new Promise(r=>setTimeout(r,8000))]);
 setInterval(()=>{if(!document.hidden)void tick()},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void tick()});
}
