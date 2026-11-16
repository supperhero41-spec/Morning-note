// Scrapes quotes and news by running the real app locally (local D1 via miniflare) and calling /api/refresh,
// exactly like the admin "Cập nhật" button does. Results stay in the local D1 (.wrangler/state).
// Used by .github/workflows/update-data.yml; also works locally: pnpm scrape
import {spawn,execSync} from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';

const PORT=process.env.SCRAPE_PORT||'5199',BASE=`http://localhost:${PORT}`;
let user=process.env.ADMIN_USERNAME,pass=process.env.ADMIN_PASSWORD;
if((!user||!pass)&&fs.existsSync('.dev.vars')){
 const vars=Object.fromEntries(fs.readFileSync('.dev.vars','utf8').split(/\r?\n/).map(l=>l.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/)).filter(Boolean).map(m=>[m[1],m[2]]));
 user=vars.ADMIN_USERNAME;pass=vars.ADMIN_PASSWORD;
}
if(!user||!pass){user='scraper';pass=crypto.randomBytes(24).toString('hex');fs.writeFileSync('.dev.vars',`ADMIN_USERNAME="${user}"\nADMIN_PASSWORD="${pass}"\n`)}
const auth='Basic '+Buffer.from(`${user}:${pass}`).toString('base64');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

console.log('Applying local migrations…');
execSync('pnpm exec wrangler d1 migrations apply DB --local --config wrangler.json',{stdio:'inherit'});

console.log('Starting local server…');
const server=spawn('pnpm',['exec','vinext','dev','--port',PORT],{stdio:['ignore','pipe','pipe'],shell:true,detached:process.platform!=='win32'});
server.stdout.on('data',d=>process.stdout.write('[dev] '+d));server.stderr.on('data',d=>process.stderr.write('[dev] '+d));
function stop(){try{if(process.platform==='win32')execSync(`taskkill /pid ${server.pid} /T /F`,{stdio:'ignore'});else process.kill(-server.pid,'SIGTERM')}catch{}}
process.on('exit',stop);

async function call(path,init={}){
 const r=await fetch(BASE+path,{...init,headers:{Authorization:auth,'Content-Type':'application/json',Origin:BASE,...(init.headers||{})},signal:AbortSignal.timeout(120000)});
 const text=await r.text();let json;try{json=JSON.parse(text)}catch{}
 if(!r.ok)throw new Error(`${path} -> ${r.status} ${text.slice(0,200)}`);return json;
}
const post=body=>call('/api/refresh',{method:'POST',body:JSON.stringify(body)});

try{
 let ready=false;
 for(let i=0;i<120&&!ready;i++){try{const r=await fetch(BASE+'/api/customer',{signal:AbortSignal.timeout(20000)});ready=r.status<500||r.status===503}catch{}if(!ready)await sleep(2000)}
 if(!ready)throw new Error('Local server did not start');

 const errors=[];
 console.log('Fetching market quotes…');
 await post({scope:'market',force:true}).catch(e=>errors.push('market: '+e.message));
 const {sourceIds}=await post({scope:'news'});
 console.log(`Fetching news from ${sourceIds.length} sources…`);
 let next=0;
 await Promise.all(Array.from({length:3},async()=>{
  while(next<sourceIds.length){
   const id=sourceIds[next++];
   try{
    let result,previous=-1,passes=0;
    do{result=await post({scope:'news',sourceId:id,force:passes===0});passes++;
     if(result.results?.some(r=>r.error)){errors.push(id+': '+result.results.find(r=>r.error).error);break}
     if(result.results?.some(r=>r.skipped))break;
     if(result.more&&(!Number.isFinite(result.processed)||result.processed<=previous))break;
     previous=result.processed;
    }while(result.more&&passes<30);
    console.log('  done',id);
   }catch(e){errors.push(id+': '+e.message)}
  }
 }));
 if(errors.length)console.warn('Some sources failed:\n  '+errors.join('\n  '));

 const snapshot=await call('/api/data');
 console.log(`Done: ${snapshot.stories?.length??0} stories, ${snapshot.quotes?.length??0} quotes in the last 24h.`);
}catch(e){console.error(e);process.exitCode=1}
finally{stop()}
