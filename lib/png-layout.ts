import type {Story} from './catalog';
export type NewsBlock={name:string;items:Story[]};
// Each heading occupies 80px. Stories are selected in two phases:
// Phase 1 – starred stories (those with an editorial rating, already sorted A→B→C then by recency
//            via applyEditorial) from both categories, round-robin until neither fits the budget.
// Phase 2 – non-starred stories sorted newest-first; the category that currently has fewer items
//            in the output gets priority so the split reflects each side's actual story supply
//            rather than forcing an equal 50/50 division.
export function fitNewsBlocks(stories:Story[],budget:number,itemHeight:(s:Story)=>number):NewsBlock[]{
 const blocks:NewsBlock[]=[{name:'TIN KINH TẾ',items:[]},{name:'TIN CHỨNG KHOÁN',items:[]}];
 const cats=['economy','stock'] as const;
 // Starred = has an editorial rating (tier A/B/C already filtered by applyEditorial; X excluded).
 const starred=cats.map(cat=>stories.filter(s=>s.category===cat&&s.editorial));
 const others=cats.map(cat=>stories.filter(s=>s.category===cat&&!s.editorial).sort((a,b)=>b.published-a.published));
 let used=cats.filter((_,i)=>starred[i].length||others[i].length).length*80;
 // Phase 1: starred from both categories, round-robin.
 const si=[0,0];
 while(true){let added=false;for(let i=0;i<2;i++){const s=starred[i][si[i]];if(!s)continue;const h=itemHeight(s);if(used+h<=budget){blocks[i].items.push(s);si[i]++;used+=h;added=true}}if(!added)break}
 // Phase 2: non-starred, newest-first; the category with fewer items selected so far goes first.
 const oi=[0,0];
 while(true){
  const avail=[0,1].filter(i=>oi[i]<others[i].length);if(!avail.length)break;
  avail.sort((a,b)=>blocks[a].items.length-blocks[b].items.length);
  let added=false;for(const i of avail){const s=others[i][oi[i]];if(!s)continue;const h=itemHeight(s);if(used+h<=budget){blocks[i].items.push(s);oi[i]++;used+=h;added=true;break}}
  if(!added)break;
 }
 return blocks.some(b=>b.items.length)?blocks.filter(b=>b.items.length):[blocks[0]];
}
