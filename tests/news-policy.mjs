import ts from 'typescript';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'news-policy-'));
try {
 for(const name of ['parsers','stock-news','news-impact','news-editorial','news-policy']){
  const source=fs.readFileSync(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from '(.\/[^']+)'/g,"from '$1.mjs'");
  fs.writeFileSync(path.join(dir,name+'.mjs'),code);
 }
 const {pendingReview,NEWS_POLICY}=await import(pathToFileURL(path.join(dir,'news-policy.mjs')));
 const now=Date.parse('2026-10-02T16:53:00+07:00');
 const story={id:'a',url:'https://example.com/a',title:'Chi phí vay mua nhà tiếp tục hạ nhiệt',sourceId:'a',source:'A',published:now-60000,collected:now,category:'excluded',timeBasis:'article'};
 assert.equal(NEWS_POLICY.keywordRequired,false);
 assert.equal(pendingReview(story,now)?.category,'pending');
 assert.ok(pendingReview(story,now)?.reviewReason);
 assert.equal(pendingReview({...story,published:now-86400001},now),null);
 assert.equal(pendingReview({...story,published:now+1},now),null);
 assert.equal(pendingReview({...story,published:0},now),null);
 assert.equal(pendingReview({...story,category:'economy'},now),null);
 console.log('PASS: unmatched article retained; review reason; expired, future, unverified dates excluded; classified story stays in its category.');
} finally {fs.rmSync(dir,{recursive:true,force:true})}
