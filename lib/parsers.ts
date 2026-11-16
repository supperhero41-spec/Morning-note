import type { Story, Source, Asset, Quote } from './catalog';
export const DAY=86400000;
export function decode(s:string):string {return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):''}).replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '}[x]||x));}
export const clean=(s:string)=>decode(s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
export function field(xml:string,tag:string):string {return decode(xml.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'))?.[1]||'').trim();}
export function dateValue(value:string):number {let s=clean(value);const local=s.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);if(local)s=`${local[3]}-${local[2]}-${local[1]}T${local[4]}:${local[5]}:${local[6]||'00'}+07:00`;else if(/^\d{2}\/\d{2}\/\d{4}$/.test(s))return 0;if(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?$/.test(s))s=s.replace(' ','T')+'+07:00';if(/^[A-Za-z]{3},? \d{1,2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2}$/.test(s))s+=' +0700';const n=Date.parse(s);return Number.isFinite(n)?n:0;}
export const in24h=(time:number,now=Date.now())=>Number.isFinite(time)&&time>0&&time<=now&&time>=now-DAY;
export const classify=(title:string)=> /chứng khoán|cổ phiếu|cổ tức|ipo|vn.?index|vn30|hose|hnx|upcom|khối ngoại|niêm yết|nâng hạng|phát hành|trái phiếu|mã chứng khoán/i.test(title)?'stock':'economy';
export const economic=(s:string)=>/nâng hạng|kinh tế|kinh doanh|doanh nghiệp|chứng khoán|cổ phiếu|cổ tức|ngân hàng|lãi suất|tỷ giá|vàng|giá dầu|xăng dầu|đầu tư|bất động sản|xuất khẩu|nhập khẩu|ngân sách|thuế|tài chính|thị trường|gdp|cpi|lạm phát|fed|doanh thu|lợi nhuận|thanh khoản|khối ngoại|vn.?index|trái phiếu|niêm yết|ipo|tín dụng|công nghiệp|fdi|thương mại|tiền tệ|tăng trưởng/i.test(s);
export function sameDomain(url:string,domain:string):boolean {try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(u.hostname===domain||u.hostname==='www.'+domain)}catch{return false;}}
export function canonical(url:string,base:string):string {try {const u=new URL(decode(url),base);u.hash='';for(const key of [...u.searchParams.keys()])if(/^(utm_|fbclid|gclid)/i.test(key))u.searchParams.delete(key);return u.toString()}catch{return '';}}
export function parseRss(xml:string,source:Source,now=Date.now()):Story[] {
 const nodes=[...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];if(!nodes.length)throw new Error('Nguồn không trả về RSS hợp lệ');
 const stories:Story[]=[];
 for(const [,node] of nodes){const title=clean(field(node,'title'));const url=canonical(field(node,'link')||field(node,'guid'),source.url);const published=dateValue(field(node,'pubDate')||field(node,'dc:date'));
  if(title.length<5||!sameDomain(url,source.domain)||false)continue;
  stories.push({id:url,title,url,sourceId:source.id,source:source.name,published,collected:now,category:classify(title),timeBasis:'feed'});
 }
 return stories;
}
export function articleDate(html:string):number {
 for(const m of html.matchAll(/<meta\b[^>]*>/gi)){const tag=m[0];if(/(?:property|name|itemprop)=["'](?:article:published_time|pubdate|datePublished)["']/i.test(tag)){const n=dateValue(tag.match(/content=["']([^"']+)/i)?.[1]||'');if(n)return n}}
 const visible=html.match(/class=["'][^"']*(?:post-time|date-post)[^"']*["'][^>]*>[\s\S]{0,160}?(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}(?::\d{2})?)/i)?.[1];if(visible)return dateValue(visible);
 const n=html.match(/["']datePublished["']\s*:\s*["']([^"']+)/i)?.[1];return dateValue(n||'');
}
export function articleTitle(html:string):string {for(const m of html.matchAll(/<meta\b[^>]*>/gi))if(/property=["']og:title["']/i.test(m[0]))return clean(m[0].match(/content=["']([^"']+)/i)?.[1]||'');return clean(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'');}
export function articleLinks(html:string,source:Source):{title:string;url:string}[] {
 const out=new Map<string,{title:string;url:string}>();
 for(const [,heading] of html.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/gi)){
  const href=heading.match(/href=["']([^"']+)/i)?.[1];if(!href)continue;const url=canonical(href,source.url),title=clean(heading);if(title.length>=20&&sameDomain(url,source.domain)&&(/\d{5,}|\.html|\.chn/.test(url)))out.set(url,{title,url});
 }
 for(const [,attrs,body] of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){const href=attrs.match(/href=["']([^"']+)/i)?.[1];if(!href)continue;const url=canonical(href,source.url),title=clean(body)||clean(attrs.match(/title=["']([^"']+)/i)?.[1]||'');if(title.length>=20&&sameDomain(url,source.domain)&&(/\d{5,}|\.html|\.chn/.test(url))&&!out.has(url))out.set(url,{title,url});}
 return [...out.values()];
}
const vnNumber=(s:string)=>{const t=clean(s).replace(/\./g,'').replace(',','.');return t?Number(t):NaN};
export function parseVietnam(html:string,list:Asset[],now=Date.now()):Quote[] {
 const table=html.match(/<table\b[^>]*class=["'][^"']*table-macro-data[^"']*["'][^>]*>([\s\S]*?)<\/table>/i)?.[1];if(!table)throw new Error('Chưa đọc được bảng dữ liệu Việt Nam');
 const head=table.match(/<thead>([\s\S]*?)<\/thead>/i)?.[1]||'';
 const periods=[...head.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(m=>clean(m[1])).filter(s=>/^\d{2}-\d{2}-\d{4}$/.test(s));
 const quotes:Quote[]=[];
 for(const a of list){for(const [,row] of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const name=clean(row.match(/<th\b[^>]*>([\s\S]*?)<\/th>/i)?.[1]||'');if(name!==a.symbol)continue;
  const cells=[...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>clean(m[1])).slice(1);const index=cells.findIndex(s=>s!==''&&Number.isFinite(vnNumber(s)));if(index<0||!periods[index])continue;
  const price=vnNumber(cells[index]),previous=vnNumber(cells[index+1]||'');const [d,m,y]=periods[index].split('-');const time=Date.parse(`${y}-${m}-${d}T00:00:00+07:00`);
  if(!Number.isFinite(price)||time>now)continue;
  const change=Number.isFinite(previous)&&a.kind==='Chỉ số'?price-previous:null;
  quotes.push({id:a.id,price,change,percent:change!==null&&previous>0?change/previous*100:null,time,fetched:now,source:'Dữ Liệu Kinh Tế · HOSE/HNX',url:'https://dulieukinhte.com/du-lieu/thi-truong-chung-khoan-335',label:'Cuối ngày',dateOnly:true,basis:change!==null?'So phiên trước':'Theo phiên',detail:'Ngày dữ liệu '+periods[index]+'. Nguồn không cung cấp giờ giao dịch; hiển thị theo phiên, không phải giá trong phiên.'});
 }}if(!quotes.length)throw new Error('Bảng Việt Nam chưa có số liệu hợp lệ');return quotes;
}
export function parseYahoo(json:any,a:Asset,now=Date.now()):Quote {
 const result=json.chart?.result?.[0],m=result?.meta;const price=Number(m?.regularMarketPrice),time=Number(m?.regularMarketTime)*1000;
 if(!m||!Number.isFinite(price)||price<=0||!time||time>now+60000)throw new Error('Không có giá hoặc thời điểm hợp lệ');
 let percent=Number.isFinite(m.regularMarketChangePercent)?m.regularMarketChangePercent:Number.isFinite(m.fulldayChangePercent)?m.fulldayChangePercent:null;
 let change=Number.isFinite(m.fulldayChange)?m.fulldayChange:Number.isFinite(m.regularMarketChange)?m.regularMarketChange:null;
 if(change===null&&percent!==null&&percent>-100)change=price-price/(1+percent/100);
 if(change===null){const previous=m.previousClose??m.chartPreviousClose; if(previous>0&&json.chart?.result?.[0]?.meta?.range==='1d'){change=price-previous;percent=change/previous*100}}
 const regular=m.currentTradingPeriod?.regular;const session=regular&&now>=regular.start*1000&&now<=regular.end*1000?'Trong giờ giao dịch':'Ngoài giờ giao dịch';
 const explicit=Number(m.exchangeDataDelayedBy);const label=session==='Ngoài giờ giao dịch'?'Phiên gần nhất':explicit>0?`Trễ ${explicit} phút`:'Độ trễ chưa xác nhận';
 return {id:a.id,price,change,percent,time,fetched:now,source:'Yahoo Finance',url:'https://finance.yahoo.com/quote/'+encodeURIComponent(a.symbol)+'/',label,basis:'So phiên trước',session,detail:(a.kind==='Hợp đồng tương lai'?'Hợp đồng tương lai gần nhất do Yahoo tổng hợp; có thể chuyển kỳ. ':'')+'Đồng bộ tối đa mỗi 2 phút; thời điểm hiển thị là thời điểm nguồn ghi nhận.'};
}

// lastmod is a discovery hint, never an article publication timestamp.
export function sitemapLinks(xml:string,source:Source,now=Date.now()):Story[]{
 return [...xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)].flatMap(([,node])=>{
  const url=canonical(field(node,'loc'),source.url),published=dateValue(field(node,'news:publication_date'));
  if(!sameDomain(url,source.domain))return [];
  if(published&&published<now-2*DAY)return [];const modified=dateValue(field(node,'lastmod'));if(!published&&modified&&modified<now-DAY)return [];
  return [{id:url,url,title:clean(field(node,'news:title')),sourceId:source.id,source:source.name,published,collected:now,category:'excluded' as const,timeBasis:published?'feed' as const:'article' as const}];
 });
}
