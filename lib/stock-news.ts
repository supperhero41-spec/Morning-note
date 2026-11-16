import {clean} from './parsers';
export type ListedStock={symbol:string;name:string;shortName:string;exchange:string};
export const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function parseVpsListedStocks(metadata:any,quotes:any):ListedStock[]{
 if(!Array.isArray(metadata)||!Array.isArray(quotes))throw new Error('Nguồn danh mục không hợp lệ');
 const active=new Set(quotes.filter(q=>q.sType==='S'&&['10','02'].includes(q.mc)&&Number(q.r)>0).map(q=>q.sym));
 const out=metadata.filter(r=>r.type==='S'&&['HOSE','HNX'].includes(r.post_to)&&active.has(r.stock_code)).map(r=>({symbol:r.stock_code,name:r.name_vn,shortName:r.name_short||'',exchange:r.post_to}));
 if(out.length<100)throw new Error('Danh mục niêm yết chưa đủ dữ liệu');return out;
}
export function parseListedStocks(json:any):ListedStock[]{
 const rows=Array.isArray(json)?json:json?.data;
 if(!Array.isArray(rows))throw new Error('Danh sách cổ phiếu không hợp lệ');
 const out=rows.filter(r=>r.type==='STOCK'&&['HOSE','HNX'].includes(r.board||r.floor)&&(!r.status||r.status==='LISTED')).map(r=>({symbol:r.symbol||r.code,name:r.organName||r.companyName||r.name||'',shortName:r.organShortName||r.shortName||'',exchange:r.board||r.floor})).filter(r=>/^[A-Z0-9]{3}$/.test(r.symbol)&&r.name);
 if(out.length<100)throw new Error('Danh sách cổ phiếu niêm yết thiếu dữ liệu');
 return out;
}
const aliases:Record<string,string[]>={DSE:['DNSE'],SAS:['SASCO'],HPG:['Hòa Phát'],VNM:['Vinamilk'],VCB:['Vietcombank'],CTG:['VietinBank'],BID:['BIDV'],TCB:['Techcombank'],VPB:['VPBank'],MBB:['MB Bank','Ngân hàng Quân đội'],STB:['Sacombank'],ACB:['Ngân hàng Á Châu'],HDB:['HDBank'],VIB:['Ngân hàng Quốc tế'],SHB:['Ngân hàng Sài Gòn Hà Nội'],TPB:['TPBank'],EIB:['Eximbank'],VIC:['Vingroup'],VHM:['Vinhomes'],VRE:['Vincom Retail'],MWG:['Thế Giới Di Động'],PNJ:['Phú Nhuận Jewelry'],FRT:['FPT Retail'],GAS:['PV GAS'],PLX:['Petrolimex'],MSN:['Masan'],SAB:['Sabeco'],VJC:['Vietjet'],HVN:['Vietnam Airlines'],NVL:['Novaland'],KDH:['Khang Điền'],DXG:['Đất Xanh'],PDR:['Phát Đạt'],DGC:['Hóa chất Đức Giang']};
export function matchStocks(title:string,body:string,stocks:ListedStock[]):{symbol:string;exchange:string;basis:'title'|'body'}[]{
 const out:ReturnType<typeof matchStocks>=[];const normalizedTitle=' '+normalize(title)+' ',normalizedBody=' '+normalize(body)+' ';
 for(const stock of stocks){
  const names=[...([stock.name,stock.shortName].map(normalize).filter(n=>n.length>=7&&n.split(' ').length>=2)),...(aliases[stock.symbol]||[]).map(normalize).filter(n=>n.length>=4)];
  function matches(text:string){const normalized=text===title?normalizedTitle:normalizedBody;const symbol=stock.symbol;const re=new RegExp('(?<![\\p{L}\\p{N}])'+symbol+'(?![\\p{L}\\p{N}])','gu');
   for(const m of text.matchAll(re)){if(symbol==='CEO'&&!/(?:cổ phiếu|mã(?: chứng khoán)?|HNX)\s*[:：-]?\s*CEO\b|\(CEO\)/i.test(text))continue;const context=text.slice(Math.max(0,m.index!-70),m.index!+symbol.length+70);if((text===title&&symbol==='FPT')||/cổ phiếu|mã (?:chứng khoán|cổ phiếu)|HOSE|HNX|niêm yết/i.test(context))return true}
   return names.some(n=>normalized.includes(' '+n+' '));
  }
  if(matches(title))out.push({symbol:stock.symbol,exchange:stock.exchange,basis:'title'});else if(matches(body))out.push({symbol:stock.symbol,exchange:stock.exchange,basis:'body'});
 }
 return out;
}
// Restrict extraction to the article, never the navigation or suggested stories.
export function articleBody(html:string):string{
 for(const [,raw] of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{const visit=(v:any):string=>{if(Array.isArray(v))return v.map(visit).join(' ');if(!v||typeof v!=='object')return '';if(typeof v.articleBody==='string')return clean(v.articleBody);return v['@graph']?visit(v['@graph']):''};const body=visit(JSON.parse(raw));if(body)return body}catch{}
 const start=/<(main|div|section|article)\b[^>]*(?:class|id)=["'][^"']*(?:article-editor|article-detail-body|fck_detail|detail-content|detail__content|article-body|article__body|entry-content|contentdetail|cms-body|detail-content-body|content-detail|detail_content|article-content|article__content|content-body)[^"']*["'][^>]*>/i.exec(html);
 if(!start)return '';
 const tag=start[1],from=start.index+start[0].length,re=new RegExp('<\\/?'+tag+'\\b[^>]*>','gi');re.lastIndex=from;let depth=1,end=html.length,m;while((m=re.exec(html))){depth+=m[0].startsWith('</')?-1:1;if(depth===0){end=m.index;break}}
 const content=html.slice(from,end).replace(/<(aside|nav|footer|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<(div|section)\b[^>]*(?:class|id)=["'][^"']*(?:related|recommend|suggest|tin-lien-quan)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi,'');
 return [...content.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>clean(m[1])).join(' ');
}

export function companyStockTopic(title:string):boolean{const text=normalize(title);return /\b(dnse|sasco)\b/.test(text)||/\b(hdqt|hoi dong quan tri|dai hoi dong co dong|dhdcd)\b/.test(text)||/\b(chuyen|chuyen san|chuyen co phieu|dua co phieu)\b.*\b(hose|hnx|upcom|niem yet)\b/.test(text)||/\b(chap thuan|dang ky|duoc|sap|chinh thuc)\b.*\bniem yet\b/.test(text)||/\b(phat hanh|chao ban|dang ky mua|dang ky ban|mua vao|ban ra|mua lai|thoai von)\b.*\b(co phieu|cp|von)\b/.test(text)||/\b(so huu|nam giu|nang ty le|tang ty le)\b.*\bvon tai\b/.test(text)}
