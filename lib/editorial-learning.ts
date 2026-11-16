import type {Story} from './catalog';
import {validEditorial,type EditorialRating} from './news-editorial';
export type ManualExample=EditorialRating & {method:'manual';category:string;note:string};
const tokens=(s:string)=>new Set(s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().match(/[a-z0-9]+/g)?.filter(x=>x.length>1&&!['cua','va','cho','tai','trong','voi','cac','nhung','mot','den','tu','tren','ve','la','co','se','da'].includes(x))||[]);
export function learnEditorial(stories:Story[],examples:ManualExample[]):EditorialRating[]{
 const saved=examples.filter(r=>validEditorial(r)&&r.method==='manual');
 return stories.flatMap(s=>{
  const direct=saved.find(r=>r.url===s.url&&r.title===s.title&&r.published===s.published);if(direct)return [direct];
  const a=tokens(s.title);if(a.size<5)return [];
  const neighbors=saved.filter(r=>r.category===s.category&&r.url!==s.url).map(r=>{const b=tokens(r.title);const overlap=[...a].filter(x=>b.has(x)).length;return {r,similarity:overlap/(a.size+b.size-overlap)}}).filter(x=>x.similarity>=0.55).sort((a,b)=>b.similarity-a.similarity);
  const top=neighbors[0];if(!top||top.similarity<0.75&&(neighbors.length<2||neighbors[1].r.tier!==top.r.tier)||neighbors.some(n=>n.similarity>=top.similarity-0.1&&n.r.tier!==top.r.tier))return [];
  // Changes in amounts can materially change importance; do not transfer such labels.
  const numbers=(t:string)=>(t.match(/\d+(?:[.,]\d+)*/g)||[]).join('|');if(numbers(s.title)!==numbers(top.r.title))return [];
  return [{version:1,url:s.url,title:s.title,published:s.published,tier:top.r.tier,confidence:'Thấp',whyToday:'Sao tham khảo từ lựa chọn của bạn cho tin tương tự. '+(top.r.note||''),eventKey:s.url,evidence:top.r.title+' — '+top.r.url,limitations:'Đối chiếu tiêu đề và nhóm tin; chưa đọc hiểu toàn bộ nội dung bằng AI. Bạn có thể sửa sao trực tiếp.',reviewedAt:top.r.reviewedAt,method:'learned-example'} as EditorialRating];
 });
}
