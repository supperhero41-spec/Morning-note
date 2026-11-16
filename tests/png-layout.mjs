import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const code=ts.transpileModule(fs.readFileSync(new URL('../lib/png-layout.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {fitNewsBlocks}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
// Baseline: no starred stories, both categories equal → round-robin fill
const stories=Array.from({length:100},(_,i)=>({id:String(i),category:i%2?'stock':'economy',published:i}));
const blocks=fitNewsBlocks(stories,2100,()=>73);const count=blocks.reduce((n,b)=>n+b.items.length,0);
assert.equal(count,26);assert.ok(count>20);assert.ok(160+count*73<=2100);assert.ok(160+(count+1)*73>2100);
assert.ok(fitNewsBlocks(stories,800,()=>73).reduce((n,b)=>n+b.items.length,0)<count);
assert.ok(fitNewsBlocks(stories,2100,()=>139).reduce((n,b)=>n+b.items.length,0)<count);
assert.equal(fitNewsBlocks(stories.slice(0,2),2100,()=>73).reduce((n,b)=>n+b.items.length,0),2);
assert.equal(fitNewsBlocks(stories.filter(s=>s.category==='stock'),2100,()=>73).length,1);
// Starred priority: starred stories must appear before non-starred in each block
const withStars=[
 {id:'e1',category:'economy',published:100,editorial:{tier:'B'}},
 {id:'e2',category:'economy',published:200},
 {id:'e3',category:'economy',published:50},
 {id:'s1',category:'stock',published:100,editorial:{tier:'A'}},
 {id:'s2',category:'stock',published:200},
];
const starBlocks=fitNewsBlocks(withStars,2100,()=>73);
const eBlock=starBlocks.find(b=>b.name==='TIN KINH TẾ');const sBlock=starBlocks.find(b=>b.name==='TIN CHỨNG KHOÁN');
assert.ok(eBlock&&eBlock.items[0].id==='e1','starred economy story must come first');
assert.ok(sBlock&&sBlock.items[0].id==='s1','starred stock story must come first');
// Unequal distribution: economy has fewer stories → gets filled from non-starred first
const sparse=[
 {id:'e1',category:'economy',published:3,editorial:{tier:'C'}},
 ...Array.from({length:10},(_,i)=>({id:`s${i}`,category:'stock',published:i})),
];
const sparseBlocks=fitNewsBlocks(sparse,600,()=>73);
// Economy starred (1) + stock starred (0) = 1 starred; remaining budget fills stock (more supply)
const eCount=sparseBlocks.find(b=>b.name==='TIN KINH TẾ')?.items.length??0;
const sCount=sparseBlocks.find(b=>b.name==='TIN CHỨNG KHOÁN')?.items.length??0;
assert.ok(sCount>=eCount,'stock (more supply) should not be capped below economy');
console.log('PASS: fills indicator height, starred stories prioritised, unequal category supply handled, one category supported');
