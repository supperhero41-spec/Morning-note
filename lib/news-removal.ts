import type {Story} from './catalog';
export type RemovedNews={url:string;title:string;category:string;removedAt:number;note:string};
export function validRemoval(r:any):r is RemovedNews{return r&&typeof r.url==='string'&&typeof r.title==='string'&&typeof r.category==='string'&&typeof r.note==='string'&&Number.isFinite(r.removedAt)}
const words=(s:string)=>new Set(s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().match(/[a-z0-9]+/g)?.filter(w=>w.length>1&&!['va','cua','cho','tai','trong','voi','cac','mot','tu','den','la','da'].includes(w))||[]);
export function removalMatch(story:Story,rules:RemovedNews[]):RemovedNews|undefined{
 const valid=rules.filter(validRemoval),direct=valid.find(r=>r.url===story.url);if(direct)return direct;
 if(story.editorial?.method==='manual')return;
 const a=words(story.title);if(a.size<6)return;
 const numbers=(s:string)=>(s.match(/\d+(?:[.,]\d+)*/g)||[]).join('|');
 return valid.find(r=>{if(r.category!==story.category||numbers(r.title)!==numbers(story.title))return false;const b=words(r.title);const common=[...a].filter(w=>b.has(w)).length;return common>=6&&common/(a.size+b.size-common)>=0.75});
}
