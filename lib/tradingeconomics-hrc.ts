import type {Quote} from './catalog';
export const TE_HRC_URL='https://tradingeconomics.com/commodity/hrc-steel';
export function parseTradingEconomicsHrc(html:string,now=Date.now()):Quote{
 const metaRaw=html.match(/TEChartsMeta\s*=\s*(\[[\s\S]*?\]);/)?.[1];const meta=metaRaw?JSON.parse(metaRaw).find((m:any)=>m.symbol==='HRC:COM'):null;
 const datasets:any[]=[];for(const [,raw] of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const j=JSON.parse(raw);datasets.push(...(Array.isArray(j)?j:j['@graph']||[j]))}catch{}}
 const dataset=datasets.find(d=>d['@type']==='Dataset'&&d.url===TE_HRC_URL);const date=dataset?.temporalCoverage?.split('/')[1];const time=typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)?Date.parse(date+'T00:00:00Z'):NaN;
 const desc=dataset?.description||'';const match=desc.match(/HRC Steel (?:fell|rose|increased|decreased|was|traded|remained)[\s\S]*?([\d,]+\.\d+)\s+USD\/T[\s\S]*?\b(down|up)\s+([\d.]+)% from the previous day/i);
 const price=meta?.last;if(!Number.isFinite(price)||price<=0||!Number.isFinite(time)||time>now+86400000||!desc.includes('USD/T'))throw Error('Thiếu giá hoặc ngày HRC xác minh từ Trading Economics');
 if(match&&Math.abs(Number(match[1].replace(/,/g,''))-price)>.02)throw Error('Giá HRC trên nguồn không đồng nhất');
 const percent=match?Number(match[3])*(match[2].toLowerCase()==='down'?-1:1):null;
 return {id:'steel',price,percent,change:null,time,dateOnly:true,fetched:now,source:'Trading Economics',url:TE_HRC_URL,label:now-time>5*86400000?'Dữ liệu cũ · kiểm tra ngày giá':'Dữ liệu theo ngày',basis:'So ngày trước theo nguồn',detail:'HRC Steel · US Midwest, đơn vị USD/T theo Trading Economics. Giá CFD theo chỉ số tham chiếu; khác HRC FOB China. Nguồn cung cấp ngày giá, không xác nhận thời gian thực.'};
}
