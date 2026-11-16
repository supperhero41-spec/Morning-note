import {normalize} from './stock-news';
export function economyTopics(title:string,body=''):string[]{
 const headline=normalize(title),lead=normalize(body).slice(0,2200);const text=headline+' '+lead;
 const topics:[string,RegExp][]=[
 ['Vĩ mô',/\b(vi mo|gdp|cpi|lam phat|tang truong kinh te|can can thuong mai|can can thanh toan|chi so san xuat|pmi|fdi|xuat nhap khau|kim ngach|ty gia|lai suat|that nghiep|du tru ngoai hoi|thu ngan sach|chi ngan sach|dau tu cong|no cong|suy thoai)\b/],
 ['Hàng hóa',/\b(gia (vang|bac|dong|thep|quang|than|dau|xang|khi|gas|ca phe|gao|cao su|duong|dau tuong|ngo|lua mi|nong san|hang hoa)|dau tho|brent|wti|opec|hang hoa the gioi|gia nang luong)\b/],
 ['Chính trị',/\b(chinh tri|dia chinh tri|bau cu|tong thong|bo chinh tri|dai hoi dang|nghi quyet trung uong|chien tranh|xung dot|trung phat|cam van|ngoai giao|dam phan thuong mai)\b/],
 ['Thị trường chứng khoán',/\b(vn index|vnindex|vn30|hnx index|upcom index|dow jones|nasdaq|s p 500|nikkei|hang seng|chung khoan (my|the gioi|chau|viet nam)|thi truong chung khoan|nang hang thi truong|khoi ngoai|phien giao dich|thanh khoan thi truong|chi so chung khoan|wall street|pho wall)\b/],
 ['Chính sách tài chính – kinh tế',/\b(chinh sach (tien te|tai khoa|tai chinh|kinh te|thue|thuong mai)|ngan hang trung uong|ngan hang nha nuoc|fed|ecb|boj|giam thue|tang thue|thue quan|thue nhap khau|thue xuat khau|thue gia tri gia tang|lai suat dieu hanh|han muc tin dung|room tin dung|goi kich thich|ho tro kinh te|cai cach kinh te|quy dinh (tai chinh|kinh te)|luat (thue|ngan sach|dau tu))\b/]
 ];
 return topics.filter(([,pattern])=>pattern.test(text)).map(([label])=>label);
}
