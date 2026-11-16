import type {Quote} from './catalog';
export const INVESTING_URLS={gold:'https://vn.investing.com/currencies/xau-usd',steel:'https://vn.investing.com/commodities/lme-steel-hrc-fob-china-futures-streaming-chart'};
export function parseInvestingQuote(html:string,id:'gold'|'steel',now=Date.now()):Quote{
 const raw=html.match(/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];if(!raw)throw Error('Chưa đọc được dữ liệu Investing.com');
 const state=JSON.parse(raw)?.props?.pageProps?.state;const instrument=id==='gold'?state?.currencyStore?.instrument:state?.commodityStore?.instrument;
 if(instrument?.base?.path!==(id==='gold'?'/currencies/xau-usd':'/commodities/lme-steel-hrc-fob-china-futures'))throw Error('Investing.com trả về mã tài sản không phù hợp');
 const p=instrument.price;const time=Number(p?.lastUpdateTime);if(p?.currency!=='USD'||!Number.isFinite(p?.last)||p.last<=0||!Number.isFinite(time)||time<=0||time>now+60000)throw Error('Thiếu giá hoặc thời điểm xác minh từ Investing.com');
 const stale=now-time>3*86400000;return {id,price:p.last,change:Number.isFinite(p.change)?p.change:null,percent:Number.isFinite(p.changePcr)?p.changePcr:null,time,fetched:now,source:'Investing.com',url:INVESTING_URLS[id],label:stale?'Dữ liệu cũ · kiểm tra ngày giá':p.isDelayed?'Dữ liệu trễ theo nguồn':'Giá trên trang nguồn',basis:'So đóng cửa trước theo nguồn',detail:(id==='gold'?'Vàng giao ngay XAU/USD, USD/oz.':'Steel HRC FOB China Futures, USD/tấn. ')+(stale?'Nguồn chưa cập nhật giá mới; đây là giá lịch sử gần nhất nguồn cung cấp.':'Thời điểm và biến động lấy cùng dữ liệu từ Investing.com.')};
}
