import type {Story} from './catalog';
import {normalize} from './stock-news';
export const IMPACT_VERSION=2;
export const IMPACT_RULES=[
 'Mục tiêu: nhận diện sự kiện có tiềm năng gây biến động giá lớn, chấm riêng thị trường và từng cổ phiếu; không phải điểm liên quan hoặc ưu tiên đọc.',
 'Sức mạnh sự kiện 35; mức bất ngờ 25; quy mô tương đối 25; độ xác thực và khả năng thực hiện 15.',
 'Sức mạnh dựa trên cơ chế thay đổi kỳ vọng lợi nhuận, định giá, cung–cầu cổ phiếu hoặc dòng tiền; không cộng điểm chỉ vì nhắc tên doanh nghiệp.',
 'Giao dịch người nội bộ/người liên quan, quyền kiểm soát, M&A, pha loãng, mất khả năng thanh toán, pháp lý nghiêm trọng, kết quả kinh doanh và sự kiện bước ngoặt được xét riêng.',
 'Đăng ký mua khác mua hoàn tất; khớp lệnh khác thỏa thuận. So giao dịch với thanh khoản bình quân và free float, không kết luận mạnh chỉ từ số cổ phiếu tuyệt đối.',
 'Tin tích cực và tiêu cực đều có thể đạt điểm cao. Chiều tác động ghi riêng; không cam kết giá tăng hay giảm.',
 'Thiếu kỳ vọng hoặc dữ liệu nền: ghi chưa đánh giá. Sự kiện mạnh vẫn là ứng viên biến động lớn – cần xác minh; không coi điểm sơ bộ là điểm hoàn chỉnh.',
 'Nhận diện hiện bằng quy tắc có căn cứ, chưa có AI ngữ nghĩa. Tiêu đề giật gân, số báo đăng lại và số keyword không làm tăng điểm.',
 'Gộp trùng trước khi xếp hạng; sắp xếp điểm sơ bộ giảm dần trong từng nhóm, bằng điểm ưu tiên bài mới.',
] as const;
export type ImpactPart={key:string;label:string;max:number;points:number|null;reason:string;evidence?:string};
export type ImpactRating={target:string;score:number;upperBound:number;assessedWeight:number;provisional:boolean;candidate:boolean;event:string|null;confidence:'Thấp';direction:'Chưa xác định';parts:ImpactPart[]};
export type NewsImpact={version:2;priority:number;candidate:boolean;market:ImpactRating;stocks:ImpactRating[]};
const rubric=[['strength','Sức mạnh sự kiện',35],['surprise','Mức bất ngờ',25],['relative','Quy mô tương đối',25],['certainty','Độ xác thực & khả năng thực hiện',15]] as const;
const stockEvents:[string,number,RegExp,string][]=[
 ['Rủi ro tài chính hoặc pháp lý nghiêm trọng',32,/\b(vo no|pha san|mat kha nang thanh toan|khoi to|bat tam giam|dinh chi giao dich|huy niem yet)\b/,'Có thể thay đổi khả năng hoạt động, quyền lợi cổ đông hoặc khả năng giao dịch.'],
 ['Thay đổi quyền kiểm soát / M&A',28,/\b(thau tom|mua lai|sap nhap|m a|quyen kiem soat|chao mua cong khai)\b/,'Có thể thay đổi quyền kiểm soát, giá trị doanh nghiệp hoặc kỳ vọng tái cấu trúc.'],
 ['Giao dịch người nội bộ hoặc người liên quan',28,/\b(chu tich|lanh dao|noi bo|nguoi lien quan|con trai|con gai|vo|chong|tong giam doc)\b.*\b(mua|ban|gom)\b.*\b(co phieu)\b/,'Có thể tác động kỳ vọng và cung–cầu cổ phiếu; cần xác minh quy mô tương đối và phương thức.'],
 ['Phát hành và pha loãng',25,/\b(phat hanh|chao ban)\b.*\b(co phieu|quyen mua|rieng le)\b/,'Có thể thay đổi số cổ phiếu lưu hành, vốn và định giá trên mỗi cổ phiếu.'],
 ['Thay đổi điều kiện giao dịch / dòng vốn',25,/\b(cat margin|cat ky quy|ngung ky quy|loai khoi ro|them vao ro|etf|diamond)\b/,'Có thể thay đổi khả năng dùng đòn bẩy hoặc nhu cầu giao dịch của quỹ.'],
 ['Kết quả kinh doanh đột biến',28,/\b(loi nhuan|ket qua kinh doanh)\b.*\b(dot bien|vuot ky vong|hut ky vong|thua lo|bao lo|ky luc|gap doi|gap ba)\b/,'Có thể thay đổi kỳ vọng lợi nhuận; mức bất ngờ cần dữ liệu trước công bố.'],
 ['Kết quả kinh doanh',18,/\b(loi nhuan|bao cao tai chinh|ket qua kinh doanh)\b/,'Có thông tin tác động lợi nhuận; chưa xác minh mức thay đổi so kỳ vọng.'],
 ['Dự án / đơn hàng bước ngoặt',24,/\b(don hang|hop dong|du an|nha may|day chuyen)\b.*\b(ky|phe duyet|van hanh|trien khai|cong suat)\b|\b(ky|phe duyet|van hanh)\b.*\b(hop dong|nha may|du an)\b/,'Có thể thay đổi doanh thu hoặc công suất; chưa xác minh quy mô so doanh nghiệp.'],
 ['Cổ tức / mua cổ phiếu quỹ',16,/\b(co tuc|co phieu quy)\b/,'Có thể thay đổi dòng tiền cổ đông hoặc cung cổ phiếu; cần đối chiếu mức đã kỳ vọng.'],
];
const marketEvents:[string,number,RegExp,string][]=[
 ['Thay đổi chính sách tiền tệ',30,/\b(lai suat|chinh sach tien te|room tin dung|han muc tin dung)\b.*\b(tang|giam|ha|nang|thay doi|noi)\b|\b(tang|giam|ha|nang|noi)\b.*\b(lai suat|room tin dung)\b/,'Có thể thay đổi chi phí vốn và dòng tiền; cần xác minh phạm vi, mức thay đổi và kỳ vọng.'],
 ['Thay đổi thuế quan / thương mại',28,/\b(ap thue|tang thue|giam thue|thue quan|cam van|trung phat thuong mai)\b/,'Có thể thay đổi chi phí, thương mại và triển vọng nhiều ngành.'],
 ['Cấu trúc thị trường / dòng vốn',28,/\b(nang hang thi truong|ha hang thi truong|thay doi quy dinh giao dich)\b/,'Có thể thay đổi khả năng tiếp cận và dòng vốn thị trường.'],
 ['Cú sốc địa chính trị',28,/\b(chien tranh|xung dot|phong toa|dong cua eo bien)\b/,'Ứng viên tác động tới khẩu vị rủi ro và nguồn cung; chưa xác minh mức lan tỏa.'],
 ['Bất ngờ dữ liệu vĩ mô',26,/\b(gdp|cpi|lam phat|pmi|that nghiep)\b.*\b(vuot du bao|thap hon du bao|bat ngo)\b/,'Bài nêu chênh lệch dự báo; cần nguồn dự báo gốc để chấm mức bất ngờ.'],
];
function rating(story:Story,target:string,body:string):ImpactRating {
 const parts:ImpactPart[]=rubric.map(([key,label,max])=>({key,label,max,points:null,reason:key==='surprise'?'Chưa có kỳ vọng trước công bố để đối chiếu.':key==='relative'?'Chưa có dữ liệu nền về doanh nghiệp, free float hoặc thanh khoản để đối chiếu.':'Chưa đủ bằng chứng.'}));
 const h=normalize(story.title),direct=target==='Thị trường'?story.category==='economy':story.stockMatches?.some(m=>m.symbol===target&&m.basis==='title');
 const event=direct?(target==='Thị trường'?marketEvents:stockEvents).find(([, ,pattern])=>pattern.test(h)):undefined;
 if(event){parts[0]={...parts[0],points:event[1],reason:event[3]+' Điểm nhận diện loại sự kiện theo quy tắc, chưa phải đo biến động giá.',evidence:story.title.slice(0,220)};
  const rumor=/\b(tin don|chua xac nhan)\b/.test(h),plan=/\b(dang ky|du kien|de xuat|ke hoach|du dinh)\b/.test(h),completed=/\b(da hoan tat|da mua|da ban|chinh thuc co hieu luc)\b/.test(h);
  if(rumor)parts[3]={...parts[3],points:1,reason:'Tiêu đề nêu tin chưa xác nhận; không xem là sự kiện đã xảy ra.',evidence:story.title.slice(0,220)};
  else if(plan)parts[3]={...parts[3],points:4,reason:'Mới đăng ký, dự kiến hoặc đề xuất; chưa xác nhận thực hiện.',evidence:story.title.slice(0,220)};
  else if(body&&completed)parts[3]={...parts[3],points:10,reason:'Nguồn báo việc đã thực hiện; chưa đối chiếu công bố gốc nên không chấm tối đa.',evidence:story.title.slice(0,220)};
 }
 const score=parts.reduce((n,p)=>n+(p.points??0),0),assessedWeight=parts.reduce((n,p)=>n+(p.points===null?0:p.max),0);
 return {target,score,upperBound:score+100-assessedWeight,assessedWeight,provisional:assessedWeight<100,candidate:!!event&&event[1]>=24,event:event?.[0]||null,confidence:'Thấp',direction:'Chưa xác định',parts};
}
export function scoreImpact(story:Story,body=''):NewsImpact {
 const market=rating(story,'Thị trường',body),stocks=(story.stockMatches||[]).map(m=>rating(story,m.symbol,body));
 return {version:2,priority:Math.max(market.score,...stocks.map(x=>x.score)),candidate:[market,...stocks].some(r=>r.candidate),market,stocks};
}
export function sortByImpact(stories:Story[]):Story[]{return [...stories].sort((a,b)=>(b.impact?.priority??0)-(a.impact?.priority??0)||b.published-a.published||a.url.localeCompare(b.url))}
export function investorScope(story:Story):boolean {
 const h=normalize(story.title);
 const business=/\b(loi nhuan|doanh thu|co tuc|bao cao tai chinh|ket qua kinh doanh|co phieu|trai phieu|phat hanh von|m a|don hang|cong suat|gia co phieu)\b/.test(h);
 if(/\b(le giang|son tung|doi tu|showbiz|nguoi dep|hoa hau|ca si|dien vien|mv|am nhac|phim anh|hon nhan|hen ho|thoi trang|meo|bi quyet|suc khoe|bong da|vi dang|mon ngon)\b/.test(h)&&!business)return false;
 if(story.category==='stock')return business||!!story.stockMatches?.some(m=>m.basis==='title');
 if(story.category==='economy')return /\b(kinh te|tang truong|lam phat|gdp|cpi|pmi|fdi|ngan sach|dau tu cong|lai suat|chi phi vay|ty gia|tin dung|tien te|tai khoa|thue|chung khoan|co phieu|thi truong|khoi ngoai|gia|xuat khau|nhap khau|kim ngach|thuong mai|cung cau|logistics|cuoc|van tai|san xuat|tieu dung|chien tranh|xung dot|trung phat|fed|ecb|boj|quy hoach|phap luat|ngan hang|nang hang)\b/.test(h);
 return business||/\b(chi phi vay|chuoi cung ung|don hang|cuoc van tai|thanh khoan|dau tu cong|xuat khau|nhap khau|lai suat|ty gia|thue quan)\b/.test(h);
}
