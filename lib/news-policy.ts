import {EDITORIAL_RULES} from './news-editorial';
import {investorScope} from './news-impact';
import type {Story} from './catalog';
import {in24h} from './parsers';
export const NEWS_POLICY = {
 version: 3,
 savedOn: '2026-10-05',
 keywordRequired: false,
 unmatchedAction: 'pending-review',
 semanticClassification: 'not-connected',
 rules: [
  'Phục vụ nhà đầu tư chứng khoán chuyên nghiệp: chỉ tin thị trường, vĩ mô, tài chính, ngành và doanh nghiệp có thông tin thực chất.',
  'Loại tin giải trí, đời tư, người nổi tiếng, mẹo sống và quảng cáo không có thông tin kinh doanh đáng kể.',
  ...EDITORIAL_RULES,

  'Thu thập từ nguồn đã chọn trước khi phân loại; chỉ bài có thời gian xuất bản xác minh trong 24 giờ.',
  'Không loại bài chỉ vì thiếu keyword. Keyword chỉ hỗ trợ nhận diện.',
  'Tin chứng khoán gồm tin trực tiếp về doanh nghiệp HOSE/HNX và sự kiện sở hữu vốn, niêm yết mới, phát hành hoặc giao dịch cổ phiếu; ưu tiên đối chiếu doanh nghiệp và mã.',
  'Tin kinh tế gồm vĩ mô, giá hàng hóa, chính trị, chứng khoán thế giới và Việt Nam, chính sách tài chính – kinh tế.',
  'Bài phù hợp phạm vi đầu tư nhưng chưa phân loại chi tiết được đưa vào dòng Tin kinh tế, có thể chỉnh sao và xuất ảnh như tin chính; không có tab Chờ duyệt riêng.',
  'AI phân loại theo ý nghĩa cần dịch vụ được kết nối; hiện chỉ có nhận diện theo quy tắc.',
  'Xóa tin được lưu lâu dài: ẩn bài đã xóa và bài có tiêu đề rất tương tự cùng nhóm, không áp dụng khi số liệu khác hoặc bài tương tự đã được bạn chấm sao. Có thể khôi phục và bỏ mẫu loại.',
  'Lọc trùng giữa nguồn và ưu tiên tiêu đề gốc rõ ràng hơn.',
 ],
} as const;
export function pendingReview(story:Story,now=Date.now()):Story|null {
 if(!investorScope(story)||!in24h(story.published,now)||story.category!=='excluded'&&story.category!=='pending')return null;
 return {...story,category:'pending',reviewReason:story.reviewReason||'Chưa xác định được chủ đề bằng quy tắc hiện tại; chưa có AI phân loại theo ý nghĩa.'};
}
