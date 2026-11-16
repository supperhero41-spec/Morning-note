import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';import os from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'editorial-'));try{
 fs.writeFileSync(path.join(dir,'editorial.mjs'),ts.transpileModule(fs.readFileSync(new URL('../lib/news-editorial.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
 const {applyEditorial,validEditorial}=await import(pathToFileURL(path.join(dir,'editorial.mjs')));
 const s={url:'https://example.com/a',title:'A',published:100};const r={version:1,...s,tier:'A',importance:40,novelty:null,urgency:18,confidence:'Trung bình',whyToday:'Risk',eventKey:'event1',evidence:'Source',limitations:'No benchmark',reviewedAt:200,method:'ai-session-pilot'};
 assert.ok(validEditorial(r));assert.equal(validEditorial({...r,importance:51}),false);assert.equal(validEditorial({...r,novelty:31}),false);
 const b={...s,url:'https://example.com/b',title:'B'};const rb={...r,...b,tier:'B',importance:50,novelty:30,urgency:20,eventKey:'event2'};
 assert.equal(applyEditorial([b,s],[rb,r])[0].url,s.url);assert.equal(applyEditorial([s],[r])[0].editorial.importance,undefined);assert.equal(applyEditorial([{...s,title:'Changed'}],[r])[0].editorial,undefined);
 assert.equal(applyEditorial([s,b],[r,{...rb,tier:'A',eventKey:r.eventKey}]).length,1);
 assert.equal(applyEditorial([s],[{...r,tier:'X'}]).length,0);assert.equal(applyEditorial([s],[])[0].editorial,undefined);
 console.log('PASS: tier before score, missing novelty retained, score validation, changed article invalidation, event dedup, exclusion, unreviewed stays unreviewed');
}finally{fs.rmSync(dir,{recursive:true,force:true})}
