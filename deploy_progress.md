# PathAI — Tiến trình Deploy

> Cập nhật lần cuối: 2026-06-08

---

## Kiến trúc

```
GitHub (toikobi401/learning-path-app)
    ↓ push to main (auto-deploy)
Vercel (Next.js)  ←→  Railway (MySQL 8)
```

---

## Checklist Deploy

### Bước 1 — Railway: Tạo MySQL
- [ ] Vào [railway.app](https://railway.app) → **New Project** → **Deploy a template** → chọn **MySQL**
- [ ] Đợi provision xong → vào tab **Variables** → copy `DATABASE_URL`
      (dạng: `mysql://root:<pass>@<host>.railway.app:<port>/railway`)
- [ ] Mở **Settings** → **Networking** → bật **Public Networking** (để Vercel kết nối được)

### Bước 2 — Migrate schema lên Railway
```powershell
# Chạy từ thư mục learning-path-app
$env:DATABASE_URL="mysql://root:<pass>@<host>.railway.app:<port>/railway"
npx prisma migrate deploy
```
- [ ] Lệnh trên chạy thành công, không lỗi

### Bước 3 — Vercel: Import project
- [ ] Vào [vercel.com](https://vercel.com) → **Add New Project** → Import `toikobi401/learning-path-app`
- [ ] **Root Directory:** `learning-path-app`
- [ ] **Framework Preset:** Next.js (tự detect)
- [ ] **Chưa deploy** — thêm env vars trước (Bước 4)

### Bước 4 — Vercel: Thêm Environment Variables
Vào **Settings** → **Environment Variables**, thêm từng biến:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | URL Railway ở Bước 1 (thêm `?connection_limit=5`) |
| `NEXTAUTH_URL` | `https://<your-app>.vercel.app` |
| `NEXTAUTH_SECRET` | Chạy: `openssl rand -base64 32` hoặc dùng chuỗi random 32 ký tự |
| `NEXTAUTH_URL_INTERNAL` | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `ENCRYPTION_KEY` | 32-byte key mã hóa API key người dùng — `openssl rand -hex 32` |
| `GROQ_API_KEY` | Groq API key (provider AI mặc định + fallback hệ thống) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary — avatar upload |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM` | SMTP gửi OTP |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_AI_API_KEY` | *(tùy chọn)* key hệ thống cho provider khác |

> **DATABASE_URL khuyến nghị:**
> ```
> mysql://root:<pass>@<host>.railway.app:<port>/railway?connection_limit=5&connect_timeout=30
> ```

- [ ] Tất cả env vars đã thêm

### Bước 5 — Deploy
- [ ] Nhấn **Deploy** → theo dõi build log
- [ ] Build thành công → copy URL app (vd: `https://learning-path-app-xxx.vercel.app`)
- [ ] Cập nhật `NEXTAUTH_URL` trên Vercel thành URL thực

### Bước 6 — Google OAuth: Cập nhật redirect URI
- [ ] Vào [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
- [ ] Chọn OAuth 2.0 Client → **Authorized redirect URIs** → **Add URI:**
      `https://<your-app>.vercel.app/api/auth/callback/google`
- [ ] Save

### Bước 7 — Kiểm tra sau deploy
- [ ] Truy cập app URL → landing page hiển thị
- [ ] Đăng ký tài khoản mới → nhận OTP email
- [ ] Xác thực email → đăng nhập thành công
- [ ] Google OAuth đăng nhập được
- [ ] Tạo goal → generate learning path (AI hoạt động)
- [ ] Quiz, chat, weekly review hoạt động
- [ ] Dark/light mode toggle
- [ ] Đổi ngôn ngữ VI ↔ EN

---

## Trạng thái

```
[Bước 1 — Railway MySQL  ]  ░░░░░░░░░░  Chưa bắt đầu
[Bước 2 — Migrate schema ]  ░░░░░░░░░░  Chưa bắt đầu
[Bước 3 — Vercel import  ]  ░░░░░░░░░░  Chưa bắt đầu
[Bước 4 — Env vars       ]  ░░░░░░░░░░  Chưa bắt đầu
[Bước 5 — Deploy         ]  ░░░░░░░░░░  Chưa bắt đầu
[Bước 6 — Google OAuth   ]  ░░░░░░░░░░  Chưa bắt đầu
[Bước 7 — Kiểm tra       ]  ░░░░░░░░░░  Chưa bắt đầu
```

---

## Ghi chú kỹ thuật

| Vấn đề | Giải pháp |
|--------|-----------|
| Vercel serverless → nhiều connection | Thêm `?connection_limit=5` vào DATABASE_URL |
| Build fail vì thiếu env | Kiểm tra tất cả biến ở Bước 4 trước khi deploy |
| Prisma generate lỗi trên Vercel | Vercel tự chạy `prisma generate` khi build nếu có `postinstall` script |
| Email OTP không gửi được | Kiểm tra SMTP config trong `.env` |
