import type {Asset} from './catalog';
export function assetSourceUrl(a:Asset):string{return a.sourceUrl??(a.provider==='yahoo'&&a.symbol?'https://finance.yahoo.com/quote/'+encodeURIComponent(a.symbol)+'/':a.provider==='coingecko'&&a.symbol?'https://www.coingecko.com/en/coins/'+encodeURIComponent(a.symbol):a.provider==='investing'?'https://vn.investing.com/currencies/xau-usd':a.provider==='tradingview'?'https://vn.tradingview.com/symbols/LME-HC1!/':'')}
export function resolveAssetSource(value:string):{provider:string;symbol:string;sourceUrl:string}{
 const u=new URL(value.trim());if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('Dùng link HTTPS hợp lệ.');let provider='',symbol='';const path=decodeURIComponent(u.pathname),host=u.hostname.toLowerCase();
 if(['finance.yahoo.com','query1.finance.yahoo.com','query2.finance.yahoo.com'].includes(host)){const match=path.match(/^\/quote\/([^/]+)/)||path.match(/^\/v8\/finance\/chart\/([^/]+)/);if(match){provider='yahoo';symbol=match[1]}}
 if(['coingecko.com','www.coingecko.com'].includes(host)){const match=path.match(/^\/[a-z-]+\/coins\/([^/]+)/);if(match){provider='coingecko';symbol=match[1]}}
 if(['api.coingecko.com'].includes(host)&&path==='/api/v3/simple/price'){const ids=u.searchParams.get('ids');if(ids&&!ids.includes(',')){provider='coingecko';symbol=ids}}
 if(['vn.investing.com','www.investing.com','investing.com'].includes(host)&&/^\/currencies\/xau-usd\/?$/.test(path)){provider='investing';symbol='XAU'}
 if(['vn.tradingview.com','www.tradingview.com','tradingview.com'].includes(host)&&/^\/symbols\/LME-HC1!\/?$/.test(path)){provider='tradingview';symbol='LME:HC1!'}
 if(!provider||!symbol||symbol.length>80)throw Error('Link chưa được hỗ trợ. Dùng Yahoo Finance, trang coin của CoinGecko, Investing XAU/USD hoặc TradingView LME-HC1!.');
 return {provider,symbol,sourceUrl:u.href};
}
