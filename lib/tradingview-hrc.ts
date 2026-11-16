import type {Quote} from './catalog';
export const HRC_URL='https://vn.tradingview.com/symbols/LME-HC1!/';
export function parseTradingViewHrc(html:string,now=Date.now()):Quote{
 for(const [,raw] of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  let data:any;try{data=JSON.parse(raw)}catch{continue}
  if(data['@type']!=='FinancialProduct'||data.tickerSymbol!=='HC1!'||!/LME Steel HRC FOB China/i.test(data.name||''))continue;
  const offer=data.offers,price=Number(offer?.price);if(offer?.priceCurrency!=='USD'||!Number.isFinite(price)||price<=0)throw Error('TradingView chưa có giá HRC hợp lệ');
  const expiry=Date.parse(offer.priceValidUntil||'');
  return {id:'steel',price,change:null,percent:null,time:0,fetched:now,source:'TradingView · LME:HC1!',url:HRC_URL,label:'Giá trên trang · chưa rõ độ trễ',basis:'Chưa có giá tham chiếu',detail:'Hợp đồng tương lai liên tục Steel HRC FOB China, USD/tấn. Giá đọc từ trang TradingView; nguồn không cung cấp giờ giao dịch trong dữ liệu công khai, nên không xác nhận realtime. Đồng bộ mỗi 5 phút khi dashboard hoạt động.'+(Number.isFinite(expiry)?' Trường hiệu lực giá trên trang: '+new Date(expiry).toISOString()+'; đây không phải giờ giao dịch.':'')};
 }
 throw Error('Chưa đọc được giá LME:HC1! trên trang TradingView');
}
