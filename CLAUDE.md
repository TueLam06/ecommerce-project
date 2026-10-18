# Stuff Corner: web bán đồ công nghệ

Monorepo gồm 2 phần, mỗi phần có `package.json` và `node_modules` riêng (không dùng workspaces):

- `client/`: React 19 + Vite + Tailwind 4 + DaisyUI, deploy trên **Vercel** (https://stuffcorner-jet.vercel.app)
- `server/`: Express 5 + PostgreSQL (`pg`, database trên Neon), deploy trên **Render** (https://stuff-corner.onrender.com)

Repo: `TueLam06/ecommerce-project`. Được gộp từ 2 repo cũ `ecommerce-client` và `ecommerce-server` bằng `git subtree`, nên commit cũ không có tiền tố `client/` hay `server/` trong đường dẫn (muốn xem lịch sử thì dùng `git log -- server.js` theo đường dẫn cũ).

Làm việc trên 2 máy (PC và laptop): đầu phiên `git pull`, cuối phiên commit + push.

## Chạy local

```bash
cd server && npm install && npm run dev   # http://localhost:5000, node --watch
cd client && npm install && npm run dev   # http://localhost:5173
```

- `npm start` ở server **không** tự nạp lại code. Sửa code mà server vẫn chạy bản cũ thì restart, hoặc kiểm tra xem có process cũ đang giữ cổng 5000 không.
- `server/.env` không commit, copy từ `server/.env.example`. Biến môi trường: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `GEMINI_API_KEY`, `BREVO_API_KEY`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME`, `CLIENT_URL`, `CLOUDINARY_*`.
- **`server/.env` local đang trỏ vào database Neon dùng chung với production**: thao tác ghi/xoá dữ liệu khi test là đụng vào dữ liệu thật.
- Client: `.env.development` (localhost:5000) và `.env.production` (URL Render) đều được commit, chỉ chứa `VITE_API_URL`. Không bao giờ để secret trong biến `VITE_*` vì chúng bị đóng gói vào JS gửi xuống trình duyệt.
- Không có test tự động. Kiểm tra bằng `npm run lint` và `npm run build` ở client (hiện có sẵn 8 lỗi/cảnh báo ESLint cũ ở admin, AuthContext, CartProvider).

## Cấu trúc

### Server
- `server.js`: khởi tạo app, gắn route, chạy migration nhỏ (`ALTER TABLE ... IF NOT EXISTS`) trước khi `listen`. Không có công cụ migration riêng, schema thay đổi thì thêm câu lệnh idempotent ở đây.
- `routes/*.routes.js`: mỗi nhóm API một file, mount dưới `/api/...`. Route admin dùng `verifyToken` + `requireAdmin`.
- `middleware/auth.middleware.js`: `verifyToken`, `requireAdmin`, `optionalAuth` (JWT trong header `Authorization: Bearer`).
- `middleware/rateLimit.middleware.js`: các limiter (`express-rate-limit`, lưu trong RAM nên restart là reset). `app.set('trust proxy', 1)` để lấy IP thật sau proxy Render.
- `config/`: `db.js` (Pool), `cloudinary.js`, `gemini.js` (LangChain + Gemini cho chatbot).
- `utils/token.js`: JWT đăng nhập; token xác thực email ký bằng secret riêng (`JWT_SECRET + ':verify-email'`) và gắn dấu vân tay mật khẩu, để không dùng thay token đăng nhập được và tự hết hiệu lực khi đăng ký lại.
- `utils/mailer.js`: gửi mail qua **Brevo HTTP API**. Thiếu `BREVO_API_KEY` thì chỉ in nội dung mail ra console (tiện test local).
- Bảng chính: `users` (có `role`, `email_verified`), `products`, `categories`, `cart_items`, `orders`, `order_items`.
- Lỗi trả về dạng JSON `{ error }` hoặc `{ message }`, thông báo bằng tiếng Việt.

### Client
- `src/api/http.js`: **nơi duy nhất** đọc `VITE_API_URL` và gọi `fetch` (hàm `authFetch(path, { method, body, token })`, ném `Error` có `message` và `code` từ server). Các module `api/*.js` và `admin/api/*.js` bọc từng endpoint. Trang và context không gọi `fetch` trực tiếp.
- `pages/*Page.jsx`: mỗi route một trang (hậu tố `Page`). `admin/`: trang quản trị (layout, pages, api riêng).
- `context/`: `AuthContext` (token lưu `localStorage`), `CartProvider` (khách vãng lai lưu giỏ trong `localStorage`, đã đăng nhập thì đồng bộ với DB và merge lúc vừa đăng nhập).
- `routes/PrivateRoute.jsx`, `routes/AdminRoute.jsx`: chặn route cần đăng nhập/admin.
- Màu chủ đạo: xanh `#2F5233`, nền `#FAFAF8`, font tiêu đề Fraunces.

## Luồng nghiệp vụ cần biết

- **Đăng ký → xác thực email**: đăng ký tạo user `email_verified = false` và gửi link `${CLIENT_URL}/verify-email?token=...` (hết hạn 24h). Chưa xác thực thì login trả `403` với `code: EMAIL_NOT_VERIFIED`. Bấm link thì xác thực và đăng nhập luôn. Email chưa xác thực được đăng ký lại (ghi đè tên/mật khẩu, link cũ hết hiệu lực). Tài khoản tạo trước tính năng này được coi là đã xác thực.
- **Đặt hàng**: `POST /api/orders` nhận cả khách vãng lai (gửi `cart` trong body) lẫn user đăng nhập (lấy giỏ từ DB). Trừ tồn kho trong transaction với `SELECT ... FOR UPDATE`. Số lượng mỗi sản phẩm 1–20, tối đa 50 sản phẩm/đơn. Chỉ giao Hà Nội và TP.HCM.
- **Rate limit**: chung 200 req/phút/IP; login sai 5 lần/15 phút (IP + email); đăng ký 10 lần thành công/giờ; gửi lại mail xác thực 3 lần/15 phút; đặt hàng 5 đơn/10 phút; chatbot 10 tin/phút; tra cứu đơn 10 lần/phút.

## Deploy

- Push lên `main` thì Vercel và Render tự deploy (Render cần bật **Auto-Deploy: On Commit**, nếu không phải bấm Manual Deploy).
- Vercel: Root Directory `client`, preset Vite. `client/vercel.json` rewrite mọi đường dẫn về `index.html` cho SPA.
- Render: Root Directory `server`, build `npm install`, start `npm start`. Biến môi trường nhập trong mục Environment; `CLIENT_URL` phải là URL Vercel (link trong email dùng biến này).
- Brevo: tài khoản free có bọc link để đếm lượt bấm (tracking), và link bọc từng trả 404. Mail xác thực vì thế có thêm link dạng chữ dưới nút. Đã tắt chặn IP lạ (Authorised IPs) để Render gửi được.

## Quy ước

- Commit message tiếng Việt, tiền tố `feat:` / `fix:` / `style:` / `ref:` / `chore:` (có thể có scope như `feat(admin):`), tiêu đề ngắn, chữ thường, thân là các gạch đầu dòng `- `. **Không** thêm dòng `Co-Authored-By`.
- Comment trong code bằng tiếng Việt, ngắn, giải thích lý do.
- Server dùng CommonJS (`require`), client dùng ES modules.
- `ROADMAP.md` và `.claude/` là ghi chú cá nhân, đã được gitignore.
