import type {Story} from './catalog';
export const EDITORIAL_VERSION=1;
export const EDITORIAL_RULES=[
 'Mục tiêu: chọn sự kiện đáng gửi khách hàng nhất hôm nay bằng mức quan trọng 1–3 sao.',
 'Đọc nội dung trước khi đánh giá: sự kiện, đối tượng, đường tác động, thông tin mới và lý do cần biết hôm nay.',
 '3 sao: Cực kỳ quan trọng; 2 sao: Quan trọng; 1 sao: Ít quan trọng. Ngoài phạm vi đầu tư bị loại; chưa đánh giá không được gán sao.',
 'Không tính điểm số. Phân loại 1–3 sao theo tầm quan trọng đầu tư, thông tin mới và tính cấp thiết hôm nay; cùng mức ưu tiên bài mới.',
 'Độ tin cậy ghi riêng. Thiếu căn cứ thì ghi chưa đánh giá, không tự suy diễn mức quan trọng.',
 'Gộp bài cùng sự kiện, chọn một bài đại diện; không ép hạn ngạch chủ đề. Tin không được đọc chưa có đánh giá sao.',
 'Sao chỉnh tay được lưu lâu dài và ưu tiên cao nhất; tin đủ tương tự được gán sao tham khảo, có bài tham chiếu. Không đủ căn cứ thì để chưa đánh giá.',
 'Thử nghiệm do AI trong phiên làm việc đọc nội dung và lưu đánh giá; tin mới chưa được tự động đánh giá khi chưa kết nối API.',
] as const;
export type EditorialRating={version:1;url:string;title:string;published:number;tier:'A'|'B'|'C'|'X';importance?:number;novelty?:number|null;urgency?:number;confidence:'Thấp'|'Trung bình'|'Cao';whyToday:string;eventKey:string;evidence:string;limitations:string;reviewedAt:number;method:'ai-session-pilot'|'manual'|'learned-example'};
export function validEditorial(r:any):r is EditorialRating{return !!r&&r.version===1&&['A','B','C','X'].includes(r.tier)&&typeof r.url==='string'&&typeof r.title==='string'&&Number.isFinite(r.published)&&Number.isFinite(r.reviewedAt)&&['ai-session-pilot','manual','learned-example'].includes(r.method)&&(r.importance===undefined||Number.isInteger(r.importance)&&r.importance>=0&&r.importance<=50)&&(r.novelty===undefined||r.novelty===null||Number.isInteger(r.novelty)&&r.novelty>=0&&r.novelty<=30)&&(r.urgency===undefined||Number.isInteger(r.urgency)&&r.urgency>=0&&r.urgency<=20)&&['Thấp','Trung bình','Cao'].includes(r.confidence)&&['whyToday','eventKey','evidence','limitations'].every(k=>typeof r[k]==='string'&&r[k].length<=1200)}
export function applyEditorial(stories:Story[],ratings:EditorialRating[]):Story[]{
 const map=new Map(ratings.filter(validEditorial).map(r=>[r.url,r]));
 const tier={A:0,B:1,C:2,X:3};
 const ranked=stories.map(s=>{const r=map.get(s.url);return {...s,editorial:r&&r.title===s.title&&r.published===s.published?{...r,importance:undefined,novelty:undefined,urgency:undefined}:undefined}}).filter(s=>s.editorial?.tier!=='X').sort((a,b)=>(a.editorial?tier[a.editorial.tier]:4)-(b.editorial?tier[b.editorial.tier]:4)||b.published-a.published);
 const events=new Set<string>();return ranked.filter(s=>{if(!s.editorial)return true;const key=s.editorial.eventKey;if(events.has(key))return false;events.add(key);return true});
}

export function editorialLevel(tier:EditorialRating['tier']):{stars:number;label:string;symbol:string}{const stars=tier==='A'?3:tier==='B'?2:tier==='C'?1:0;return {stars,label:stars===3?'Cực kỳ quan trọng':stars===2?'Quan trọng':stars===1?'Ít quan trọng':'Ngoài phạm vi',symbol:'★'.repeat(stars)}}
