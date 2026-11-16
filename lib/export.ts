export const STATIC_SITE=(import.meta as any).env?.VITE_STATIC==='1';
export const assetUrl=(path:string)=>(((import.meta as any).env?.BASE_URL as string)||'/')+path;
import {fitNewsBlocks} from './png-layout';
import {applyEditorial} from './news-editorial';
import {configuredAssets,groups,type Snapshot,type Story} from './catalog';
export async function exportPng(snapshot:Snapshot,stories:Story[],now:number){
 const logo=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();const timeout=setTimeout(()=>reject(new Error('Không tải được logo FinSuccess. Vui lòng thử lại.')),10000);img.onload=()=>{clearTimeout(timeout);resolve(img)};img.onerror=()=>{clearTimeout(timeout);reject(new Error('Không tải được logo FinSuccess. Vui lòng thử lại.'))};img.src=assetUrl('finsuccess-logo.png')});
 const header=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();const timeout=setTimeout(()=>reject(new Error('Không tải được header PNG. Vui lòng thử lại.')),10000);img.onload=()=>{clearTimeout(timeout);resolve(img)};img.onerror=()=>{clearTimeout(timeout);reject(new Error('Không tải được header PNG. Vui lòng thử lại.'))};img.src=assetUrl('png-header-template.png')});
 stories=applyEditorial(stories.filter(s=>!s.hiddenFromCustomer),stories.flatMap(s=>s.editorial?[s.editorial]:[]));
 const width=1500,pad=44,left=490,gap=46,right=width-pad*2-left-gap;const canvas=document.createElement('canvas'),measure=canvas.getContext('2d')!;
 const nums=(n:number,p=2)=>new Intl.NumberFormat('vi-VN',{minimumFractionDigits:p,maximumFractionDigits:p}).format(n);const stamp=(n:number)=>new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(n);
 const wrap=(text:string,max:number,size:number)=>{measure.font=`${size}px Arial`;const lines:string[]=[];let line='';for(const word of text.split(/\s+/)){if(measure.measureText((line?line+' ':'')+word).width>max&&line){lines.push(line);line=word}else line+=(line?' ':'')+word}if(line)lines.push(line);return lines};
 const assets=configuredAssets(snapshot.settings);const order=snapshot.settings.groupOrder.map(id=>groups.find(g=>g.id===id)).filter(Boolean);let leftHeight=0;for(const group of order){const count=assets.filter(a=>a.group===group!.id&&!snapshot.settings.hiddenAssets.includes(a.id)).length;if(count)leftHeight+=64+count*88;}
 const blocks=fitNewsBlocks(stories,leftHeight,s=>wrap(s.title,right-42,23).length*33+12);let rightHeight=blocks.reduce((n,b)=>n+80+b.items.reduce((m,s)=>m+wrap(s.title,right-42,23).length*33+12,0)+(b.items.length?0:60),0);
 const height=Math.max(leftHeight,rightHeight)+340;canvas.width=width*2;canvas.height=height*2;const c=canvas.getContext('2d')!;c.scale(2,2);c.fillStyle='white';c.fillRect(0,0,width,height);
 // Keep the supplied branding, contact details and original scannable QR.
 const headerHeight=width*211/1726;c.drawImage(header,14,10,1726,211,0,0,width,headerHeight);
 // Replace the sample date with the current Vietnam publication date.
 const sx=width/1726,dateX=(1024-14)*sx,dateY=(104-10)*sx,dateW=146*sx,dateH=50*sx;
 const dateBg=c.createLinearGradient(dateX,dateY,dateX+dateW,dateY);dateBg.addColorStop(0,'#12244f');dateBg.addColorStop(1,'#10214d');c.fillStyle=dateBg;c.fillRect(dateX,dateY,dateW,dateH);
 c.fillStyle='white';c.font=`${44*sx}px Arial`;c.fillText(new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit'}).format(now),dateX+8*sx,dateY+40*sx);
 c.textAlign='left';c.fillStyle='#64748b';c.font='16px Arial';c.fillText('Chốt bản tin: '+stamp(now)+' · Thời điểm dữ liệu được ghi riêng tại từng chỉ số.',pad,224);
 const quotes=new Map(snapshot.quotes.map(q=>[q.id,q]));let y=264;
 for(const group of order){if(!assets.some(a=>a.group===group!.id&&!snapshot.settings.hiddenAssets.includes(a.id)))continue;c.fillStyle='#10234e';c.font='bold 24px Arial';c.fillText(group!.name.toUpperCase(),pad,y+26);y+=64;for(const a of assets.filter(a=>a.group===group!.id&&!snapshot.settings.hiddenAssets.includes(a.id))){const q=quotes.get(a.id);c.fillStyle='#1a2639';c.font='bold 21px Arial';c.fillText(a.name,pad,y+20);c.font='15px Arial';c.fillStyle='#64748b';c.fillText(a.unit+' · '+(q?(!q.time?'Chưa có giờ giá':q.dateOnly?new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'}).format(q.time):stamp(q.time)):'Chưa có dữ liệu'),pad,y+46);c.font='13px Arial';c.fillText(q?q.source+' · '+q.label:'Chưa có nguồn cập nhật phù hợp',pad,y+68);c.textAlign='right';c.font='bold 22px Arial';c.fillStyle='#1a2639';c.fillText(q?nums(q.price,a.precision):'—',pad+left,y+20);const val=q?.change??q?.percent??0;c.fillStyle=val>0?'#00834d':val<0?'#cc3450':'#64748b';c.font='bold 16px Arial';c.fillText(q&&q.change!==null?(q.change>0?'+':'')+nums(q.change,a.precision)+(q.percent!==null?' ('+(q.percent>0?'+':'')+nums(q.percent)+'%)':''):'—',pad+left,y+47);c.textAlign='left';c.strokeStyle='#e5eaf1';c.beginPath();c.moveTo(pad,y+80);c.lineTo(pad+left,y+80);c.stroke();y+=88}}
 let ry=264;const x=pad+left+gap;for(const block of blocks){c.font='bold 25px Arial';c.fillStyle='#10234e';c.fillText(block.name,x,ry+26);ry+=65;if(!block.items.length){c.font='20px Arial';c.fillStyle='#64748b';c.fillText('Chưa có tin phù hợp trong 24 giờ.',x,ry+24);ry+=60}for(const s of block.items){c.fillStyle='#2aa891';c.beginPath();c.arc(x+5,ry+13,4,0,Math.PI*2);c.fill();c.font='23px Arial';c.fillStyle='#1a2639';const lines=wrap(s.title,right-42,23);for(const line of lines){c.fillText(line,x+25,ry+22);ry+=33}ry+=12}ry+=15}
 c.strokeStyle='#d7dfea';c.beginPath();c.moveTo(pad,height-80);c.lineTo(width-pad,height-80);c.stroke();c.font='15px Arial';c.fillStyle='#64748b';c.fillText('FinSuccess · Market Note · Giá: Yahoo Finance / CoinGecko / Investing.com / TradingView · Tin từ các nguồn đã chọn.',pad,height-47);c.fillText('Dữ liệu có thể trễ theo nguồn. Thông tin tham khảo.',pad,height-24);
 // Center the original logo over the finished image without obscuring the text.
 const watermarkWidth=width*0.56,watermarkHeight=watermarkWidth*logo.naturalHeight/logo.naturalWidth;
 c.save();c.globalAlpha=0.08;c.drawImage(logo,(width-watermarkWidth)/2,(height-watermarkHeight)/2,watermarkWidth,watermarkHeight);c.restore();
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG failed')),'image/png'));const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='market-note-'+new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export async function exportPngMorning(snapshot:Snapshot,stories:Story[],now:number){
 const header=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();const timeout=setTimeout(()=>reject(new Error('Không tải được header Bản tin sáng. Vui lòng thử lại.')),10000);img.onload=()=>{clearTimeout(timeout);resolve(img)};img.onerror=()=>{clearTimeout(timeout);reject(new Error('Không tải được header Bản tin sáng. Vui lòng thử lại.'))};img.src=assetUrl('png-header-morning.png')});
 stories=applyEditorial(stories.filter(s=>!s.hiddenFromCustomer),stories.flatMap(s=>s.editorial?[s.editorial]:[]));
 const width=1500,pad=44,left=490,gap=46,right=width-pad*2-left-gap;const canvas=document.createElement('canvas'),measure=canvas.getContext('2d')!;
 const nums=(n:number,p=2)=>new Intl.NumberFormat('vi-VN',{minimumFractionDigits:p,maximumFractionDigits:p}).format(n);
 const wrap=(text:string,max:number,size:number)=>{measure.font=`${size}px Arial`;const lines:string[]=[];let line='';for(const word of text.split(/\s+/)){if(measure.measureText((line?line+' ':'')+word).width>max&&line){lines.push(line);line=word}else line+=(line?' ':'')+word}if(line)lines.push(line);return lines};
 const symbolMap:Record<string,string>={dji:'DJI',spx:'US500',ixic:'IXIC',nya:'NYA',ndx:'NDX',n225:'JP225',hsi:'HK50',ssec:'SSEC',kospi:'KS11',asx:'AXJO',wti:'CL',brent:'LCO',gas:'NG',gold:'',steel:'MHCC1',btc:'BTC/USD',eth:'ETH/USD',sol:'SOL/USD',bnb:'BNB/USD',link:'LINK/USD'};
 const assets=configuredAssets(snapshot.settings);const order=snapshot.settings.groupOrder.map(id=>groups.find(g=>g.id===id)).filter(Boolean);
 let leftHeight=0;for(const group of order){const count=assets.filter(a=>a.group===group!.id&&!snapshot.settings.hiddenAssets.includes(a.id)).length;if(count)leftHeight+=64+count*88;}
 const itemHeight=(s:Story)=>wrap(s.title,right-40,22).length*32+14;
 const blocks=fitNewsBlocks(stories,leftHeight-65,itemHeight);
 let rightHeight=65+blocks.reduce((n,b)=>n+55+b.items.reduce((m,s)=>m+itemHeight(s),0)+(b.items.length?0:50),0);
 const contentTop=264;const height=contentTop+Math.max(leftHeight,rightHeight)+60;
 canvas.width=width*2;canvas.height=height*2;const c=canvas.getContext('2d')!;c.scale(2,2);c.fillStyle='white';c.fillRect(0,0,width,height);
 c.drawImage(header,0,0,width,182);
 const dateStr=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit'}).format(now);
 c.fillStyle='#023c31';c.fillRect(742,70,115,48);c.fillStyle='white';c.font='bold 36px Arial';c.textAlign='left';c.fillText(dateStr,744,107);
 const sepX=pad+left+gap/2;c.strokeStyle='#e2e8f0';c.lineWidth=1;c.beginPath();c.moveTo(sepX,contentTop-12);c.lineTo(sepX,height-36);c.stroke();
 const quotes=new Map(snapshot.quotes.map(q=>[q.id,q]));let y=contentTop;
 for(const group of order){
  const list=assets.filter(a=>a.group===group!.id&&!snapshot.settings.hiddenAssets.includes(a.id));if(!list.length)continue;
  c.textAlign='center';c.fillStyle='#00473e';c.font='bold 24px Arial';c.fillText(group!.name.toUpperCase(),pad+left/2,y+30);y+=64;
  for(const a of list){
   const q=quotes.get(a.id);
   c.textAlign='left';c.fillStyle='#111827';c.font='bold 21px Arial';c.fillText(a.name,pad,y+22);
   let timeText='Chưa có giờ giá';
   if(q?.time){if(q.dateOnly){timeText=new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit'}).format(q.time)}else{timeText=new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(q.time)}}
   const ticker=symbolMap[a.id]!==undefined?symbolMap[a.id]:(q?.label||'');const subText=ticker?`${timeText} | ${ticker}`:timeText;
   const val=q?.change??q?.percent??0;const dotColor=val>0?'#16a34a':val<0?'#ef4444':'#94a3b8';
   const cx=pad+7,cy=y+49,r=6;
   c.save();c.strokeStyle=dotColor;c.lineWidth=1.5;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(cx,cy);c.lineTo(cx,cy-3.5);c.moveTo(cx,cy);c.lineTo(cx+3,cy);c.stroke();c.restore();
   c.font='15px Arial';c.fillStyle='#64748b';c.fillText(subText,pad+20,y+54);
   c.textAlign='right';c.font='bold 22px Arial';c.fillStyle='#111827';c.fillText(q?nums(q.price,a.precision):'—',pad+left,y+22);
   c.font='bold 16px Arial';c.fillStyle=val>0?'#16a34a':val<0?'#dc2626':'#64748b';
   const changeStr=q&&q.change!==null?(q.change>0?'+':'')+nums(q.change,a.precision)+(q.percent!==null?' ('+(q.percent>0?'+':'')+nums(q.percent)+'%)':''):'—';
   c.fillText(changeStr,pad+left,y+54);
   c.strokeStyle='#e5eaf1';c.lineWidth=1;c.beginPath();c.moveTo(pad,y+78);c.lineTo(pad+left,y+78);c.stroke();
   y+=88;
  }
 }
 let ry=contentTop;const xNews=pad+left+gap;c.textAlign='left';c.fillStyle='#00473e';c.font='bold 25px Arial';c.fillText('MỘT SỐ TIN TỨC ĐÁNG CHÚ Ý',xNews,ry+28);ry+=65;
 for(const block of blocks){
  c.font='bold 23px Arial';c.fillStyle='#00473e';c.fillText(block.name,xNews,ry+26);ry+=55;
  if(!block.items.length){c.font='20px Arial';c.fillStyle='#64748b';c.fillText('Chưa có tin phù hợp trong 24 giờ.',xNews,ry+24);ry+=50}
  for(const s of block.items){
   const lines=wrap(s.title,right-40,22);
   c.fillStyle='#111827';c.font='bold 22px Arial';c.fillText('•',xNews+4,ry+22);
   c.font='22px Arial';for(let l=0;l<lines.length;l++){c.fillText(lines[l],xNews+28,ry+22);ry+=32}
   ry+=14;
  }
  ry+=10;
 }
 c.fillStyle='#003632';c.fillRect(0,height-14,width,14);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG failed')),'image/png'));
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;
 a.download='ban-tin-sang-'+new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)+'.png';
 a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
