# Market Note V2 — Trang quản trị trên GitHub Pages

Trang quản trị chạy hoàn toàn trên GitHub, không cần Cloudflare hay máy chủ:

- **GitHub Pages** (`.github/workflows/pages.yml`, chạy khi push lên `main`) đăng trang quản trị tĩnh (`pnpm build:static`). Trang chạy chính các API `/api/data`, `/api/settings`, `/api/editorial` ngay trong trình duyệt, trên một bản SQLite (sql.js) nạp từ nhánh `data`.
- **Nhánh `data`** là nơi lưu dữ liệu:
  - `config.json`: mọi chỉnh sửa của admin (sao, ẩn tin, chuyển mục, xóa tin, cấu hình nguồn/chỉ số). Trang quản trị commit file này qua GitHub API mỗi khi bạn lưu.
  - `cache.json.gz`: cache của bộ cào tin. `view.json.gz`: phần dữ liệu trang quản trị đọc.
- **GitHub Actions** (`.github/workflows/update-data.yml`) cào tin: dựng app tại chỗ với D1 cục bộ, nạp dữ liệu từ nhánh `data`, gọi `/api/refresh` như nút Cập nhật cũ, rồi ghi lại nhánh `data`. Chỉ chạy khi bấm **Cập nhật** trên trang (không có lịch tự động).

Không có trang khách hàng trên GitHub.

## Thiết lập một lần

1. Tạo repository **public** (GitHub Pages miễn phí cần repo public; dữ liệu trên nhánh `data` vì vậy ai cũng xem được). Upload toàn bộ nội dung thư mục này, trừ node_modules, dist, dist-static, .data, .dev.vars, .wrangler.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Settings → Actions → General → Workflow permissions: chọn **Read and write permissions** (để workflow ghi nhánh `data`).
4. Tab Actions: chạy "Cào tin (lưu vào nhánh data)" một lần để tạo nhánh `data`. Workflow "Đăng trang quản trị lên GitHub Pages" tự chạy khi push; link trang hiện trong lượt chạy đó, dạng `https://<tài khoản>.github.io/<tên repo>/`.
5. Tạo token: GitHub → Settings → Developer settings → Fine-grained tokens → chỉ chọn repository này, quyền **Contents: Read and write** và **Actions: Read and write**. Mở link trang, dán token để đăng nhập.

Token là "mật khẩu" quản trị: chỉ lưu trong trình duyệt bạn dùng, ai có token đó mới sửa được dữ liệu. Đặt hạn ngắn và tạo lại khi hết hạn. Bấm "Đăng xuất" (góc trái dưới) để xóa token khỏi trình duyệt.

## Sử dụng

- **Cập nhật**: gửi lệnh cào tin tới GitHub Actions. Mất khoảng 3–6 phút (gồm thời gian chờ máy); trang hiện tiến độ và tự tải dữ liệu mới khi xong.
- Các thao tác sao, ẩn tin, chuyển mục, xóa tin, cấu hình được lưu ngay vào `config.json` (mỗi lần lưu là một commit). Lượt cào tin sau dùng cấu hình mới.
- Xuất PNG/PDF chạy trong trình duyệt như cũ.

## Chạy trên máy

Bản đầy đủ (Worker + D1 cục bộ) vẫn chạy như trước:

```sh
pnpm install --frozen-lockfile
pnpm db:local
pnpm dev
```

`pnpm scrape` cào tin vào D1 cục bộ mà không cần mở trình duyệt. Dữ liệu cục bộ và nhánh `data` trên GitHub là hai nơi riêng.

## Kiểm tra

```sh
pnpm typecheck
pnpm build:static
node tests/news-policy.mjs
node tests/png-layout.mjs
```

---

(Phần dưới là tài liệu bản Cloudflare cũ, không dùng cho GitHub Pages.)

# Market Note V2 — GitHub + Cloudflare

Bản mã nguồn độc lập từ V2 ngày 10/10/2026. Có giao diện khách hàng/admin, giá chỉ số, lấy tin RSS/HTML, phân loại, sao, ẩn tin, chuyển mục, cấu hình nguồn/chỉ số, PNG/PDF và D1 lưu dữ liệu. Giữ nguyên bộ vẽ PNG của V2. Không truy cập cơ sở dữ liệu của website gốc hoặc V2 trên Sites.

**GitHub Pages không chạy được đầy đủ tính năng này.** GitHub lưu mã và chạy quy trình triển khai; Cloudflare Workers chạy API và D1 lưu dữ liệu. Phí/giới hạn phụ thuộc gói dịch vụ của bạn. Không cần máy chủ riêng. Có thể chạy thử hoàn toàn trên máy tính trước.

## 1. Chạy trên máy tính

Cài Node.js 24 và Git, mở terminal tại thư mục chứa package.json:

```sh
corepack enable
pnpm install --frozen-lockfile
cp .dev.vars.example .dev.vars
```

Trên Windows PowerShell dùng `Copy-Item .dev.vars.example .dev.vars` thay cho cp.
Sửa ADMIN_USERNAME và ADMIN_PASSWORD trong `.dev.vars`: tên không có dấu `:`, mật khẩu dài và riêng; dùng ASCII cho thông tin Basic Auth. **Không commit `.dev.vars` lên GitHub.**

```sh
pnpm db:local
pnpm dev
```

Mở địa chỉ terminal hiển thị (thường http://localhost:5173). `/khach-hang` xem bản tin; `/admin` hiện hộp đăng nhập của trình duyệt. Dữ liệu local không chung với production. Các lần đầu sử dụng sẽ khởi tạo bản chụp cấu hình/tin lúc tạo bản sao 09/10/2026; mở admin và bấm **Cập nhật** để lấy dữ liệu mới. Tin quá 24 giờ tự hết hạn nên bản chụp cũ có thể không hiện tin.

## 2. Tạo production

Tạo tài khoản Cloudflare rồi:

```sh
pnpm exec wrangler login
pnpm exec wrangler d1 create market-note-v2-db
node scripts/configure-d1.mjs UUID_TRA_VE_TU_LENH_TREN
pnpm exec wrangler secret put ADMIN_USERNAME --config wrangler.json
pnpm exec wrangler secret put ADMIN_PASSWORD --config wrangler.json
pnpm deploy
```

Thay UUID_TRA_VE_TU_LENH_TREN bằng database_id thật; không gõ nguyên placeholder. Khi được hỏi secret, nhập tên/mật khẩu quản trị production. Trang khách hàng công khai ở URL workers.dev được trả về; `/admin` được bảo vệ bằng Basic Auth qua HTTPS. Không có đăng nhập ChatGPT. Đổi mật khẩu bằng `wrangler secret put ADMIN_PASSWORD --config wrangler.json`; trình duyệt có thể nhớ đăng nhập đến khi đóng hoàn toàn. Có thể dùng cửa sổ riêng tư để đổi tài khoản.

## 3. Đưa lên GitHub và tự triển khai

Tạo repository mới (khuyên dùng private), upload **nội dung bên trong thư mục market-note-v2**, bao gồm `.github/workflows/deploy.yml`, các dotfile và pnpm-lock.yaml. Không upload node_modules, dist, .dev.vars, .wrangler hoặc token.

Hoặc dùng Git:

```sh
git init
git add .
git commit -m "Import Market Note V2"
git branch -M main
git remote add origin URL_REPOSITORY_CUA_BAN
git push -u origin main
```

Ở Settings → Secrets and variables → Actions, thêm:

- CLOUDFLARE_API_TOKEN: token được quyền chỉnh Workers Scripts và D1 trong tài khoản của bạn.
- CLOUDFLARE_ACCOUNT_ID: account ID Cloudflare.
- D1_DATABASE_ID: UUID D1 đã tạo.

Secrets ADMIN_USERNAME/ADMIN_PASSWORD phải đã được đặt trên Worker theo bước 2; workflow không lưu mật khẩu vào mã nguồn. Mỗi push lên main hoặc chạy workflow thủ công sẽ kiểm tra TypeScript, build, áp dụng migrations và deploy. Nếu đổi tên Worker trong wrangler.json thì phải đặt lại hai secret cho tên mới.

## Chức năng và giới hạn thực tế

- Tự lấy giá/tin mỗi 15 phút **khi admin đang mở**. Hai giao diện đọc dữ liệu mỗi 30 giây. Không có cron khi đóng trang; bản V2 gốc cũng dùng cơ chế này.
- Nguồn ngoài có thể giới hạn truy cập/429 hoặc chặn Cloudflare; chương trình giữ dữ liệu tốt gần nhất và hiển thị trạng thái. Không đảm bảo mọi nguồn luôn trả dữ liệu.
- Dữ liệu sản xuất lưu trong D1. Các thay đổi local không tự đồng bộ lên D1 production.
- HTML được tạo riêng trước đó là bản offline. Repository này có backend thật và đầy đủ API.
- Giữ các migration SQL đã áp dụng; thêm migration mới khi đổi schema.
- Cấu hình nguồn khởi tạo và tin nhúng là bản chụp 09/10/2026, không chứa database live đầy đủ, cookie đăng nhập hoặc sao chỉnh tay mới nhất trên website Sites.

## Kiểm tra

```sh
pnpm typecheck
node tests/news-policy.mjs
node tests/png-layout.mjs
pnpm build
```

Không commit bí mật. Worker tự loại bỏ các header định danh giả và chỉ cấp quyền ghi sau khi kiểm tra tài khoản quản trị. Website Sites hiện tại không bị thay đổi bởi gói này.
