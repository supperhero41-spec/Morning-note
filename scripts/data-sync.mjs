// Moves data between the local D1 file (used by `pnpm scrape`) and the files kept on the `data` branch.
//   node scripts/data-sync.mjs import <dir>   load <dir>/config.json + cache.json.gz into local D1
//   node scripts/data-sync.mjs export <dir>   write cache.json.gz + view.json.gz (+ config.json if missing)
// Files: config.json = admin edits (site_config, written by the admin page),
//        cache.json.gz = scraper cache (feed_cache), view.json.gz = the part of it the admin page reads.
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const [mode,dir]=process.argv.slice(2);
if(!['import','export'].includes(mode)||!dir){console.error('Usage: data-sync.mjs import|export <dir>');process.exit(2)}
const D1_DIR='.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const files=fs.existsSync(D1_DIR)?fs.readdirSync(D1_DIR).filter(f=>f.endsWith('.sqlite')&&f!=='metadata.sqlite'):[];
if(files.length!==1)throw new Error(`Expected one local D1 file in ${D1_DIR}, found ${files.length}. Run: pnpm db:local`);
const db=new DatabaseSync(path.join(D1_DIR,files[0]));
const DAY=86400000,KEEP_DAYS=3,INVALIDATE='cache-invalidate:';
const VIEW=/^(news:|news-audit:|market:|registry:listed$)/;
// Per-article caches only matter while the article can still be in the 24h window.
const PRUNE=/^(article-classification:|article-date:)/;
const file=name=>path.join(dir,name);
const readJson=name=>{const p=file(name);if(!fs.existsSync(p))return null;const buf=fs.readFileSync(p);return JSON.parse((name.endsWith('.gz')?zlib.gunzipSync(buf):buf).toString('utf8'))};

if(mode==='import'){
 const config=readJson('config.json')||[],cache=readJson('cache.json.gz')||[];
 db.exec('BEGIN');
 try{
  if(config.length){db.exec('DELETE FROM site_config');const s=db.prepare('INSERT INTO site_config (key,value) VALUES (?,?)');for(const r of config)s.run(r.key,r.value)}
  if(cache.length){db.exec('DELETE FROM feed_cache');const s=db.prepare('INSERT INTO feed_cache (key,payload,attempted_at,succeeded_at,error) VALUES (?,?,?,?,?)');for(const r of cache)s.run(r.key,r.payload,r.attempted_at,r.succeeded_at,r.error??null)}
  // Admin changed a source/asset URL: drop its old cached results (recorded by the admin page).
  const del=db.prepare('DELETE FROM feed_cache WHERE key=? AND attempted_at<?');
  for(const r of config)if(r.key.startsWith(INVALIDATE))del.run(r.key.slice(INVALIDATE.length),Number(r.value)||0);
  db.exec('DELETE FROM refresh_leases');
  db.exec('COMMIT');
 }catch(e){db.exec('ROLLBACK');throw e}
 console.log(`Imported ${config.length} config rows, ${cache.length} cache rows.`);
}else{
 fs.mkdirSync(dir,{recursive:true});
 const cutoff=Date.now()-KEEP_DAYS*DAY;
 const rows=db.prepare('SELECT key,payload,attempted_at,succeeded_at,error FROM feed_cache ORDER BY key').all().map(r=>({...r}));
 const cache=rows.filter(r=>!PRUNE.test(r.key)||Math.max(r.succeeded_at,r.attempted_at)>=cutoff);
 const view=rows.filter(r=>VIEW.test(r.key));
 const gz=data=>zlib.gzipSync(JSON.stringify(data),{level:9});
 fs.writeFileSync(file('cache.json.gz'),gz(cache));
 fs.writeFileSync(file('view.json.gz'),gz(view));
 // config.json belongs to the admin page; only bootstrap it on the very first run.
 if(!fs.existsSync(file('config.json'))){
  const config=db.prepare('SELECT key,value FROM site_config ORDER BY key').all().map(r=>({key:r.key,value:r.value}));
  fs.writeFileSync(file('config.json'),'[\n'+config.map(r=>JSON.stringify(r)).join(',\n')+'\n]\n');
  console.log(`Bootstrapped config.json with ${config.length} rows.`);
 }
 const size=n=>(fs.statSync(file(n)).size/1024).toFixed(0)+' KB';
 console.log(`Exported cache ${cache.length}/${rows.length} rows (${size('cache.json.gz')}), view ${view.length} rows (${size('view.json.gz')}).`);
}
db.close();
