import {configuredAssets,groups,type Snapshot} from '../lib/catalog';
import {assetSourceUrl} from '../lib/asset-source';
const rules=[
 ['Cập nhật & thời gian',[
 'Khi trang admin đang mở: tự cập nhật giá và tin mỗi 15 phút. Nút Cập nhật chạy ngay; không có lịch chạy khi trang đóng.',
 'Hai trang đọc lại dữ liệu đã lưu mỗi 30 giây. Đồng hồ hiển thị theo giờ Việt Nam (UTC+7).',
 'Chỉ giữ tin xác minh được thời gian xuất bản trong 24 giờ gần nhất; tin hết hạn tự rời danh sách.',
 'Nguồn tin có chu kỳ kiểm tra riêng từ 5 phút đến 24 giờ; cập nhật thủ công bỏ qua chu kỳ cache.',
 'Lấy tin theo lô, tối đa 3 nguồn đồng thời, tối đa 2 lượt mỗi nguồn trong một lần cập nhật. Tiến độ được lưu để tiếp tục lượt sau; giới hạn lấy dữ liệu 90 giây, sau đó đọc kết quả.',
 'Lỗi một nguồn không xoá dữ liệu đã lấy thành công của nguồn khác. Giá lưu trước đó có thể còn hiển thị kèm trạng thái lỗi/cũ.'
 ]],
 ['Thu thập & phân loại tin',[
 'Chỉ đọc nguồn được bật. Hỗ trợ RSS hoặc HTML; link HTTPS, tên miền nhận từ URL; HTML phải qua kiểm tra robots.txt.',
 'Giữ tiêu đề và link bài gốc. Dùng ngày trong feed hoặc metadata bài để xác minh; bài không rõ ngày không được coi là tin mới.',
 'Phạm vi: thị trường, vĩ mô, tài chính, ngành và doanh nghiệp; loại giải trí, đời tư, mẹo sống và quảng cáo không có thông tin kinh doanh đáng kể.',
 'Phân loại hiện bằng quy tắc trong tiêu đề/nội dung, không dùng dịch vụ AI ngữ nghĩa. Thiếu từ khoá không tự động loại bài nếu vẫn phù hợp phạm vi.',
 'Đối chiếu doanh nghiệp/mã HOSE/HNX bằng danh mục đã xác minh, có thời hạn 7 ngày. Khi danh mục lưu và dự phòng đều quá hạn, trang khách hàng cũng thử cập nhật từ VPS; lỗi nguồn không làm mất dữ liệu đã lưu.',
 'Tin nêu trực tiếp doanh nghiệp niêm yết, sở hữu vốn, phát hành/giao dịch cổ phiếu, HĐQT/ĐHĐCĐ và niêm yết mới được đưa vào Tin chứng khoán. Sự kiện cổ phiếu rõ ràng vẫn vào mục này khi chưa khớp danh mục.',
 'Tin có tiêu đề về cổ tức vào mục Tin chứng khoán, kể cả chưa nhận diện được mã doanh nghiệp. Chuyển mục bằng tay vẫn được ưu tiên.',
 'Tin bảng giá vàng/xăng/dầu vẫn ở Tin kinh tế dù nhắc thương hiệu/doanh nghiệp (ví dụ PNJ), nếu không có sự kiện cổ phiếu, cổ tức, doanh thu, lợi nhuận, phát hành hoặc niêm yết. Sự kiện cổ phiếu rõ ràng và chuyển mục thủ công được ưu tiên.',
 'Tin kinh tế gồm vĩ mô, hàng hoá, chính trị, thị trường và chính sách kinh tế. Tin phù hợp nhưng chưa phân loại chi tiết vào Tin kinh tế; không có mục Chờ duyệt riêng.',
 'Nút ← chuyển sang Tin kinh tế, nút → chuyển sang Tin chứng khoán, tự lưu theo URL. Lựa chọn thủ công được ưu tiên và giữ qua các lần cập nhật; có thể chuyển sang chứng khoán dù chưa khớp mã.'
 ]],
 ['Gộp trùng & mẫu loại cũ',[
 'Gộp bài cùng URL hoặc tiêu đề chuẩn hoá giống nhau. Bài tương tự khác nguồn được so nhóm, thời gian (tối đa 18 giờ), mã cổ phiếu, số liệu, sự kiện và chiều tăng/giảm.',
 'Nội dung có dấu vân tay trùng từ 78% hoặc tiêu đề đạt ngưỡng tương đồng sẽ được gộp; ưu tiên tiêu đề rõ, có số liệu/mã/sự kiện cụ thể.',
 'Tránh gộp các bài có số liệu, mã hoặc chiều biến động khác nhau. Các tiêu đề giật gân có độ ưu tiên thấp hơn khi chọn đại diện.',
 'Các mẫu xoá tin lưu từ phiên bản cũ vẫn có thể loại bài cùng URL và bài rất tương tự; có ngoại lệ khi số liệu khác hoặc bài tương tự đã được chấm sao. Giao diện hiện dùng ẩn tin thay cho xoá.'
 ]],
 ['Chấm sao & thứ tự',[
 'Chọn ★/★★/★★★ tự lưu. 3 sao → 2 sao → 1 sao → chưa có sao; cùng mức sao xếp tin mới nhất trước, cuối cùng phân biệt bằng ID.',
 'Lựa chọn bằng tay được ưu tiên. Có thể tham khảo sao từ mẫu cùng nhóm và tiêu đề tương tự: ít nhất 5 từ có nghĩa, tương đồng từ 0,55; cần mức 0,75 hoặc hai mẫu đồng thuận, không có mẫu gần mức tương đồng nhưng khác sao.',
 'Không chuyển sao tham khảo nếu dãy số trong tiêu đề khác mẫu. Sao tham khảo có độ tin cậy thấp, có thể sửa trực tiếp.',
 'Reset từng tin xoá sao và ngăn mẫu học gán lại cho URL đó. Reset tất cả xoá toàn bộ sao và mẫu đánh giá sau bước xác nhận.',
 'Điểm tác động và lý do đánh giá không được hiển thị. Thứ tự danh sách hiện dựa trên sao và thời gian.'
 ]],
 ['Trang khách hàng & phân trang',[
 'Khách hàng là trang mặc định; công tắc Quản trị/Khách hàng ở góc trên chuyển qua lại trong cùng tab.',
 'Nút mắt tự lưu ẩn/hiện theo URL: tin ẩn chỉ bị loại khỏi trang khách hàng, vẫn có ở admin. Sao và mục của tin được giữ.',
 'Mỗi mục 10 tin/trang. Có trang đầu/cuối, trang lân cận, dấu …, Trước/Sau và ô Đến trang; đổi trang cuộn đến đầu mục. Tìm kiếm hoặc đổi nguồn đưa về trang 1.',
 'Tìm theo tiêu đề; lọc nguồn và mức sao kết hợp với nhau. Đã bỏ tab Tất cả/Kinh tế/Chứng khoán; hai cột luôn hiện đồng thời và mỗi mục chứa toàn bộ tin thuộc mục đó qua các trang.',
 'Khách hàng xem sao ở hàng nguồn/thời gian; không có công cụ sửa, dòng Bài gốc hay ghi chú xác minh 24 giờ.'
 ]],
 ['Chỉ số & lưu cấu hình',[
 'Màn hình máy tính trên 1.050px: bốn bảng chỉ số chia đều một hàng, không trượt ngang; màn hình nhỏ hơn xếp hai cột, dưới 480px xếp một cột. Tin kinh tế bên trái, Tin chứng khoán bên phải; dưới 700px hai mục xếp dọc.',
 'Trang khách hàng ẩn dòng phiên gần nhất và tên/link nguồn ở từng chỉ số; vẫn giữ cảnh báo dữ liệu cũ hoặc thiếu dữ liệu. Cỡ chữ và khoảng cách chỉ số được thu gọn.',
 'Mặc định 4 nhóm, mỗi nhóm 5 chỉ số. Tick để chọn hiển thị; không giới hạn cứng 5. Chỉ số mới chưa được chọn; nút Chọn 5 chỉ số đầu khôi phục lựa chọn trong nhóm.',
 'Cho sửa tên, link dữ liệu, đơn vị, số thập phân 0–6 và thêm/bỏ chỉ số. Tối đa 100 chỉ số, 25 nguồn tin.',
 'Link chỉ số hỗ trợ Yahoo Finance, CoinGecko, Investing XAU/USD và TradingView LME-HC1!. Tự nhận provider và mã từ link; link chưa hỗ trợ báo lỗi khi lưu.',
 'Chỉ số chưa có link có thể lưu khi chưa tick; chỉ số đang hiển thị phải có mã/link hợp lệ. Giá Yahoo cache 2 phút, CoinGecko 5 phút, vàng 1 phút, HRC 5 phút.',
 'CoinGecko lấy thay đổi 24h; Yahoo lấy so phiên trước. Một số coin mặc định có Yahoo dự phòng; coin thêm mới không tự có nguồn dự phòng.',
 'Lưu cấu hình lưu tên nguồn cho cả tin đã có. Đổi link/mã/phương thức xoá cache liên quan; Kiểm tra & đồng bộ lưu trước rồi cập nhật.',
 'Chỉ tài khoản admin được lưu cấu hình, đổi sao, ẩn/chuyển tin và cập nhật dữ liệu; yêu cầu ghi phải cùng origin. Khách hàng chỉ đọc.'
 ]],
 ['Xuất PNG & PDF',[
 'Bố cục PNG được giữ độc lập với giao diện web; các thay đổi bảng chỉ số và hai cột tin trên web không đổi bố cục ảnh xuất.',
 'Hỗ trợ 2 mẫu xuất PNG: Mẫu 1 (FinSuccess gốc có watermark) và Mẫu 2 (Bản tin sáng với header tư vấn & layout danh sách chuẩn).',
 'PNG dùng dữ liệu và bộ lọc đang xem tại lúc bấm xuất; chỉ số theo tick và thứ tự nhóm đã lưu. Tin ẩn với khách hàng vẫn có thể xuất từ admin.',
 'Tin trong PNG chỉ có tiêu đề, ưu tiên sao rồi tin mới; số tin được tự cân theo chiều cao cột chỉ số, không chỉ giới hạn 10 tin của trang đang xem.',
 'Header dùng ngày Việt Nam tự động cập nhật. PNG có độ phân giải cao gấp đôi kích thước canvas.',
 'PDF dùng chế độ in của trình duyệt; giữ thời điểm hiển thị trong khi in và ẩn công cụ quản trị.'
 ]]
];
export default function AdminRules({data}:{data:Snapshot}){return <section className="admin-rules"><h2>Ghi chú · Logic & quy tắc đang áp dụng</h2><p>Ghi chú cập nhật ngày 09/10/2026: các quy tắc dưới đây mô tả phiên bản V2 đang chạy. Bảng cấu hình lấy từ dữ liệu đã lưu, không phải bản nháp trong cửa sổ Cấu hình.</p>{rules.map(([title,items])=><details key={title as string}><summary>{title}</summary><ul>{(items as string[]).map(item=><li key={item}>{item}</li>)}</ul></details>)}<details><summary>Nguồn tin hiện tại · {data.settings.sources.filter(s=>s.enabled).length}/{data.settings.sources.length} đang bật</summary><div className="rules-table"><table><thead><tr><th>Nguồn</th><th>Trạng thái</th><th>Phương thức / chu kỳ</th><th>Link</th></tr></thead><tbody>{data.settings.sources.map(s=><tr key={s.id}><td>{s.name}</td><td>{s.enabled?'Bật':'Tắt'}</td><td>{s.mode.toUpperCase()} · {s.interval/60} phút</td><td><a href={s.url} target="_blank" rel="noopener noreferrer">{s.url}</a></td></tr>)}</tbody></table></div></details><details><summary>Chỉ số & thứ tự nhóm hiện tại</summary>{data.settings.groupOrder.map(id=><div key={id}><h3>{groups.find(g=>g.id===id)?.name}</h3><ul>{configuredAssets(data.settings).filter(a=>a.group===id).map(a=><li key={a.id}>{data.settings.hiddenAssets.includes(a.id)?'Ẩn':'Hiện'} · {a.name} · {a.unit} · {a.precision} chữ số thập phân · <a href={assetSourceUrl(a)||undefined} target="_blank" rel="noopener noreferrer">{assetSourceUrl(a)||'Chưa có link'}</a></li>)}</ul></div>)}</details></section>}
