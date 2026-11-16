import type {Story} from './catalog';
import {normalize} from './stock-news';
const stop=new Set('va cua cho cac nhung mot voi trong tai ve da dang se la duoc theo tu khi nay ngay hom den sau truoc tren nhu co lai hon van thi ma de bang qua vao o'.split(' '));
const tokens=(s:string)=>normalize(s).split(' ').filter(w=>w.length>1&&!stop.has(w));
const hash=(s:string)=>{let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return n>>>0};
// Winnowed hashes retain evidence of shared wording, without retaining article text.
export function contentFingerprint(body:string):number[]{
 const words=normalize(body).split(' ').slice(0,2200);if(words.length<70)return [];
 const shingles=Array.from({length:words.length-6},(_,i)=>hash(words.slice(i,i+7).join(' ')));const out=new Set<number>();
 for(let i=0;i<=shingles.length-6;i++)out.add(Math.min(...shingles.slice(i,i+6)));
 return [...out].slice(0,650);
}
const events=[/co tuc|chia (tien|thuong)|tra (tien|co tuc)/,/phat hanh|tang von/,/loi nhuan|bao lai|bao lo|ket qua kinh doanh/,/thanh khoan|khoi luong|khop lenh|giao dich/,/gia vang/,/gia dau|brent|wti/,/lai suat/,/thue|thue quan/];
const eventIds=(s:string)=>events.map((r,i)=>r.test(normalize(s))?i:-1).filter(i=>i>=0);
function overlap<T>(a:T[],b:T[]){const set=new Set(b);return a.filter(x=>set.has(x)).length/Math.max(1,Math.min(a.length,b.length))}
export function sameNews(a:Story,b:Story):boolean{
 const x=normalize(a.title),y=normalize(b.title);if(x===y||a.url===b.url)return true;
 if(a.category!==b.category||Math.abs(a.published-b.published)>18*3600000)return false;
 const leftNumbers:string[]=x.match(/\b\d+(?: \d+)*\b/g)||[],rightNumbers:string[]=y.match(/\b\d+(?: \d+)*\b/g)||[];
 // Preserve headlines that report different figures or successive market updates.
 if(leftNumbers.length&&rightNumbers.length&&!leftNumbers.some(n=>rightNumbers.includes(n)))return false;
 const leftStocks=a.stockMatches?.filter(m=>m.basis==='title').map(m=>m.symbol)||[],rightStocks=b.stockMatches?.filter(m=>m.basis==='title').map(m=>m.symbol)||[];
 if(leftStocks.length&&rightStocks.length&&!leftStocks.some(s=>rightStocks.includes(s)))return false;
 const af=a.contentFingerprint||[],bf=b.contentFingerprint||[];
 if(af.length>=30&&bf.length>=30&&overlap(af,bf)>=.78)return true;
 const at=[...new Set(tokens(a.title))],bt=[...new Set(tokens(b.title))];const ae=eventIds(a.title),be=eventIds(b.title);
 if(ae.length&&be.length&&!ae.some(i=>be.includes(i)))return false;
 const direction=(t:string)=>/\b(giam|ha|mat)\b/.test(t)?-1:/\b(tang|len|vuot)\b/.test(t)?1:0;if(direction(x)&&direction(y)&&direction(x)!==direction(y))return false;
 const common=at.filter(t=>bt.includes(t));const jaccard=common.length/Math.max(1,new Set([...at,...bt]).size);
 const sameSpecificEvent=leftStocks.some(s=>rightStocks.includes(s))&&leftNumbers.some(n=>rightNumbers.includes(n))&&ae.some(i=>be.includes(i));
 return (sameSpecificEvent&&common.length>=4&&jaccard>=.4)||(common.length>=5&&jaccard>=.66&&overlap(at,bt)>=.8);
}
export function titleClarity(story:Story):number{
 const title=story.title,n=normalize(title),count=tokens(title).length;let score=0;
 if(title.length>=35&&title.length<=150)score+=8;else if(title.length>180)score-=8;
 score+=Math.min(5,count/3);
 if(/\d/.test(title))score+=4;
 if(story.stockMatches?.some(m=>m.basis==='title'))score+=5;
 if(/\b(tang|giam|ban hanh|phe duyet|phat hanh|chi tra|cong bo|loi nhuan|doanh thu|lai suat|ty gia|gia vang|gia dau|thue|gdp|cpi)\b/.test(n))score+=4;
 if(/\b(vn index|fed|chinh phu|ngan hang nha nuoc|my|trung quoc|viet nam|pnj|fpt|hoa phat)\b/.test(n))score+=3;
 if(/phia sau|bat ngo|gay soc|chan dong|su that|dieu gi|vi sao|dong luc nao|giai cuu|an so|bai toan|nang tam|khong the tin|lo dien|dang chu y|dang noi|co hoi nao/.test(n))score-=6;
 if(/[?!…]/.test(title))score-=3;
 return score;
}
export function deduplicateNews(input:Story[]):Story[]{
 const ordered=[...input].sort((a,b)=>titleClarity(b)-titleClarity(a)||b.published-a.published||a.url.localeCompare(b.url));
 const groups:Story[][]=[];
 for(const story of ordered){const group=groups.find(items=>items.every(other=>sameNews(story,other)));if(group)group.push(story);else groups.push([story])}
 return groups.map(items=>items[0]).sort((a,b)=>b.published-a.published);
}
