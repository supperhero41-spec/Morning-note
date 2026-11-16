// Live quotes fetched directly by the browser (GitHub Pages build only).
// TradingView's public scanner and Binance's public market-data API both allow cross-origin reads,
// so prices refresh every few seconds without running the GitHub scraper. Assets without a mapping
// keep the quote from the last scrape.
import type {Asset,Quote} from '../../lib/catalog';

// Yahoo/Investing/TradingView asset symbols -> TradingView scanner tickers.
const TRADINGVIEW:Record<string,string>={
 '^DJI':'DJ:DJI','^GSPC':'SP:SPX','^IXIC':'NASDAQ:IXIC','ES=F':'CME_MINI:ES1!','^NDX':'NASDAQ:NDX',
 '^N225':'TVC:NI225','^HSI':'TVC:HSI','000001.SS':'SSE:000001','^KS11':'KRX:KOSPI','^NSEI':'NSE:NIFTY',
 'CL=F':'NYMEX:CL1!','BZ=F':'ICEEUR:BRN1!','NG=F':'NYMEX:NG1!','GC=F':'COMEX:GC1!','XAU':'OANDA:XAUUSD',
};
// CoinGecko ids -> Binance USDT pairs.
const BINANCE:Record<string,string>={bitcoin:'BTCUSDT',ethereum:'ETHUSDT',solana:'SOLUSDT',binancecoin:'BNBUSDT',chainlink:'LINKUSDT',ripple:'XRPUSDT',dogecoin:'DOGEUSDT',cardano:'ADAUSDT'};

const live=new Map<string,Quote>();
export const liveQuotes=()=>live;

const tvTicker=(a:Asset)=>a.provider==='tradingview'?a.symbol:TRADINGVIEW[a.symbol];
const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:null;

function delayLabel(mode:unknown){
 const m=/^delayed_streaming_(\d+)$/.exec(String(mode||''));
 if(m)return {label:'Trễ khoảng '+Math.round(Number(m[1])/60)+' phút',realtime:false};
 return String(mode)==='streaming'?{label:'Gần thời gian thực',realtime:true}:{label:'Giá TradingView',realtime:false};
}

async function fromTradingView(assets:Asset[],now:number){
 const byTicker=new Map<string,Asset[]>();
 for(const a of assets){const t=tvTicker(a);if(t)byTicker.set(t,[...(byTicker.get(t)||[]),a])}
 if(!byTicker.size)return;
 // text/plain keeps this a "simple" CORS request (the scanner does not allow a JSON content-type preflight).
 const r=await fetch('https://scanner.tradingview.com/global/scan',{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({symbols:{tickers:[...byTicker.keys()]},columns:['close','change','change_abs','update_time','update_mode']}),signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw new Error('TradingView '+r.status);
 const json:any=await r.json();
 for(const row of json.data||[]){
  const [close,percent,change,updated,mode]=row.d||[];const price=finite(close);if(price===null)continue;
  const {label}=delayLabel(mode);
  for(const a of byTicker.get(row.s)||[])live.set(a.id,{id:a.id,price,change:finite(change),percent:finite(percent),time:finite(updated)?updated*1000:now,fetched:now,source:'TradingView',url:'https://www.tradingview.com/symbols/'+String(row.s).replace(':','-')+'/',label,basis:'So phiên trước',detail:'Mã '+row.s+' trên TradingView, trình duyệt tự cập nhật vài giây một lần. Giá có thể lệch nhẹ so với nguồn của bản cào tin.'});
 }
}

async function fromBinance(assets:Asset[],now:number){
 const pairs=new Map<string,Asset[]>();
 for(const a of assets){const p=a.provider==='coingecko'?BINANCE[a.symbol]:undefined;if(p)pairs.set(p,[...(pairs.get(p)||[]),a])}
 if(!pairs.size)return;
 const r=await fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbols='+encodeURIComponent(JSON.stringify([...pairs.keys()])),{signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw new Error('Binance '+r.status);
 for(const t of (await r.json()) as any[]){
  const price=Number(t.lastPrice);if(!Number.isFinite(price)||price<=0)continue;
  const base=String(t.symbol).replace(/USDT$/,'');
  for(const a of pairs.get(t.symbol)||[])live.set(a.id,{id:a.id,price,change:Number(t.priceChange),percent:Number(t.priceChangePercent),time:Number(t.closeTime)||now,fetched:now,source:'Binance',url:'https://www.binance.com/en/trade/'+base+'_USDT',label:'Gần thời gian thực',basis:'So 24 giờ trước',detail:'Cặp '+t.symbol+' trên Binance (USDT ≈ USD), trình duyệt tự cập nhật vài giây một lần.'});
 }
}

/** Refresh live quotes for the configured, visible assets. Never throws; false when a source failed. */
export async function updateLiveQuotes(assets:Asset[],hidden:string[]=[]){
 const visible=assets.filter(a=>!hidden.includes(a.id)),now=Date.now();
 const ids=new Set(visible.map(a=>a.id));for(const id of [...live.keys()])if(!ids.has(id))live.delete(id);
 const results=await Promise.allSettled([fromTradingView(visible,now),fromBinance(visible,now)]);
 return results.every(r=>r.status==='fulfilled');
}

/** Replace scraped quotes with live ones (drops duplicate ids, e.g. old per-coin rows). */
export function mergeLiveQuotes<T extends {quotes?:Quote[]}>(snapshot:T):T{
 if(!live.size||!Array.isArray(snapshot.quotes))return snapshot;
 return {...snapshot,quotes:[...snapshot.quotes.filter(q=>!live.has(q.id)),...live.values()]};
}
