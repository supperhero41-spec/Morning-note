import type {EditorialRating} from './news-editorial';
import type {NewsImpact} from './news-impact';
export type Asset = { sourceUrl?:string; id:string; name:string; symbol:string; group:string; unit:string; precision:number; provider:string; kind:string };
export const groups = [
  {id:'us',name:'Chứng khoán Mỹ',eyebrow:'WALL STREET'},
  {id:'asia',name:'Chứng khoán châu Á',eyebrow:'ASIA PACIFIC'},
  {id:'commodity',name:'Hàng hóa',eyebrow:'COMMODITIES'},
  {id:'crypto',name:'Tiền điện tử',eyebrow:'DIGITAL ASSETS'},
];
const asset = (id:string,name:string,symbol:string,group:string,unit='Điểm',precision=2,provider='yahoo',kind='Chỉ số'):Asset => ({id,name,symbol,group,unit,precision,provider,kind});
export const assets:Asset[] = [
  asset('dji','Dow Jones','^DJI','us'),asset('spx','S&P 500','^GSPC','us'),asset('ixic','Nasdaq Composite','^IXIC','us'),asset('nya','NYSE Composite','^NYA','us'),asset('ndx','Nasdaq 100','^NDX','us'),
  asset('n225','Nikkei 225','^N225','asia'),asset('hsi','Hang Seng','^HSI','asia'),asset('ssec','Shanghai Composite','000001.SS','asia'),asset('kospi','KOSPI','^KS11','asia'),asset('asx','S&P/ASX 200','^AXJO','asia'),
  asset('wti','Dầu thô WTI','CL=F','commodity','USD/thùng',2,'yahoo','Hợp đồng tương lai'),asset('brent','Dầu Brent','BZ=F','commodity','USD/thùng',2,'yahoo','Hợp đồng tương lai'),asset('gas','Khí tự nhiên','NG=F','commodity','USD/MMBtu',3,'yahoo','Hợp đồng tương lai'),
  asset('gold','Vàng XAU/USD','XAU','commodity','USD/oz',2,'investing','Giao ngay'),asset('steel','Steel HRC FOB China','LME:HC1!','commodity','USD/tấn',2,'tradingview','Hợp đồng tương lai'),
  asset('btc','BTC/USD','bitcoin','crypto','USD',2,'coingecko','Biến động 24h'),asset('eth','ETH/USD','ethereum','crypto','USD',2,'coingecko','Biến động 24h'),asset('sol','SOL/USD','solana','crypto','USD',3,'coingecko','Biến động 24h'),asset('bnb','BNB/USD','binancecoin','crypto','USD',2,'coingecko','Biến động 24h'),asset('link','LINK/USD','chainlink','crypto','USD',3,'coingecko','Biến động 24h'),
];
export type Source = {id:string;name:string;domain:string;url:string;mode:'rss'|'html';interval:number;enabled:boolean};
const source=(id:string,name:string,domain:string,path:string,mode:'rss'|'html'='rss',interval=300):Source=>({id,name,domain,url:'https://'+domain+path,mode,interval,enabled:true});
export const sources:Source[] = [
 source('tbtc','Thời báo Tài chính Việt Nam','thoibaotaichinhvietnam.vn','/rss_feed/'),source('baodautu','Báo Đầu tư','baodautu.vn','/','html',600),source('tnck','Báo Đầu tư Chứng khoán','tinnhanhchungkhoan.vn','/','html',600),source('tbn','Thời báo Ngân hàng','thoibaonganhang.vn','/rss_feed/'),source('vneconomy','VnEconomy','vneconomy.vn','/tin-moi.rss'),source('dddn','Diễn đàn Doanh nghiệp','diendandoanhnghiep.vn','/','html',600),source('ktdt','Kinh tế & Đô thị','kinhtedothi.vn','/','html',900),source('ncdt','Nhịp cầu Đầu tư','nhipcaudautu.vn','/','html',600),source('ktdb','Kinh tế và Dự báo','kinhtevadubao.vn','/','html',900),source('vnexpress','VnExpress · Kinh doanh','vnexpress.net','/rss/kinh-doanh.rss'),source('tuoitre','Tuổi Trẻ · Kinh tế','tuoitre.vn','/kinh-doanh.rss'),source('thanhnien','Thanh Niên · Kinh tế','thanhnien.vn','/rss/kinh-te.rss'),source('vietnamnet','VietNamNet · Kinh doanh','vietnamnet.vn','/kinh-doanh.rss'),source('cafef','CafeF','cafef.vn','/home.rss'),source('vietnambiz','VietnamBiz','vietnambiz.vn','/tin-moi-nhat.rss'),source('vietstock','Vietstock','vietstock.vn','/chu-de/1-2/moi-cap-nhat.htm','html',600),
];
export type Quote = {id:string;price:number;change:number|null;percent:number|null;time:number;fetched:number;source:string;url:string;label:string;basis:string;detail?:string;session?:string;dateOnly?:boolean};
export type Story = {stockTopic?:string;categoryOverride?:boolean;hiddenFromCustomer?:boolean;id:string;title:string;url:string;sourceId:string;source:string;published:number;collected:number;category:string;timeBasis:'feed'|'article';stockMatches?:{symbol:string;exchange:string;basis:'title'|'body'}[];editorial?:EditorialRating;impact?:NewsImpact;reviewReason?:string;stockRuleVersion?:number;ingestVersion?:number;contentFingerprint?:number[];dedupVersion?:number;economyTopics?:string[]};
export type SourceState = Source & {attemptedAt:number;succeededAt:number;error:string|null;count:number;audit?:{processed?:number;complete?:boolean;discovered:number;in24h:number;unknownDate:number;dateErrors:number;bodyErrors:number;emptyBodies:number;eligible:number;excluded:number;endpointErrors:string[];checkedAt:number}|null};
export function configuredAssets(settings:Settings):Asset[]{return settings.assets||assets;}
export type Settings = {assets?:Asset[];title:string;subtitle:string;hiddenAssets:string[];groupOrder:string[];sources:Source[]};
export const defaultSettings:Settings = {title:'MARKET NOTE',subtitle:'BẢN TIN THỊ TRƯỜNG',hiddenAssets:[],groupOrder:groups.map(g=>g.id),sources};
export type Snapshot = {removedNews?:import('./news-removal').RemovedNews[];autoHiddenNewsCount?:number;stockRegistry?:{count:number;checkedAt:number;error:string|null};quotes:Quote[];stories:Story[];pendingStories?:Story[];newsPolicy?:{version:number;keywordRequired:boolean;semanticClassification:string;rules:readonly string[]};sources:SourceState[];settings:Settings;checkedAt:number;generatedAt:number;marketErrors:{id:string;error:string|null;attemptedAt:number;succeededAt:number}[];storageError?:string};
