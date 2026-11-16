import ts from 'typescript';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'impact-'));
try{for(const name of ['parsers','stock-news','news-impact','news-editorial','news-policy']){let code=ts.transpileModule(fs.readFileSync(new URL('../lib/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from '(.\/[^']+)'/g,"from '$1.mjs'");fs.writeFileSync(path.join(dir,name+'.mjs'),code)}
const {scoreImpact,sortByImpact,investorScope}=await import(pathToFileURL(path.join(dir,'news-impact.mjs')));
const {matchStocks}=await import(pathToFileURL(path.join(dir,'stock-news.mjs')));assert.equal(matchStocks('CEO Đoàn Văn Hiểu Em mua cổ phiếu DMX','',[{symbol:'CEO',name:'Công ty cổ phần Tập đoàn C.E.O',shortName:'C.E.O',exchange:'HNX'}]).length,0);
const {pendingReview}=await import(pathToFileURL(path.join(dir,'news-policy.mjs')));
const s={id:'a',url:'https://example.com/a',title:'Con trai Chủ tịch HPG đăng ký mua 50 triệu cổ phiếu',sourceId:'a',source:'A',published:Date.now()-60000,collected:Date.now(),category:'stock',timeBasis:'article',stockMatches:[{symbol:'HPG',exchange:'HOSE',basis:'title'}]};
const i=scoreImpact(s);assert.equal(i.version,2);assert.equal(i.stocks[0].parts[0].points,28);assert.equal(i.stocks[0].parts[1].points,null);assert.equal(i.stocks[0].parts[2].points,null);assert.equal(i.stocks[0].parts[3].points,4);assert.equal(i.stocks[0].score,32);assert.equal(i.market.score,0);assert.equal(i.candidate,true);assert.equal(i.stocks[0].direction,'Chưa xác định');
const rumor=scoreImpact({...s,title:'Tin đồn Chủ tịch HPG mua 50 triệu cổ phiếu'});assert.equal(rumor.stocks[0].parts[3].points,1);assert.ok(rumor.priority<i.priority);
const done=scoreImpact({...s,title:'Con trai Chủ tịch HPG đã mua 50 triệu cổ phiếu'},'Nội dung nguồn thông báo hoàn tất');assert.ok(done.priority>i.priority);
const weak=scoreImpact({...s,title:'HPG giới thiệu bộ nhận diện thương hiệu'});assert.equal(weak.priority,0);assert.equal(weak.candidate,false);
const negative=scoreImpact({...s,title:'HPG mất khả năng thanh toán'});assert.ok(negative.priority>=i.priority);assert.equal(negative.candidate,true);
const macro=scoreImpact({...s,title:'Ngân hàng trung ương giảm lãi suất',category:'economy',stockMatches:[]});assert.equal(macro.market.parts[0].points,30);assert.equal(macro.stocks.length,0);
assert.equal(investorScope({...s,title:'Lê Giang chia sẻ chuyện đời tư',stockMatches:[]}),false);assert.equal(pendingReview({...s,title:'Sơn Tùng ra MV mới',category:'excluded',stockMatches:[]}),null);
assert.ok(investorScope({...s,title:'Chi phí vay mua nhà tiếp tục hạ nhiệt',category:'excluded',stockMatches:[]}));
const ranked=sortByImpact([{...s,id:'low',impact:weak},{...s,id:'high',impact:i}]);assert.equal(ranked[0].id,'high');assert.equal(scoreImpact(s).priority,scoreImpact({...s,source:'Different publisher'}).priority);
for(const r of [i.market,...i.stocks]){assert.ok(r.score>=0&&r.score<=100);assert.ok(r.upperBound<=100);assert.equal(r.parts.reduce((n,p)=>n+p.max,0),100);assert.equal(r.score,r.parts.reduce((a,b)=>a+(b.points??0),0))}
console.log('PASS: stock/market separation, bounded score, missing data, rumors, HPG registration vs completion, strong negative event, non-event not scored, entertainment exclusion, duplicate-independent score, descending sort.');
}finally{fs.rmSync(dir,{recursive:true,force:true})}
