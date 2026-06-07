# PathAI — Tiến trình implement

> Cập nhật lần cuối: 2026-06-07

---

## Tổng quan

| Module | Tên | Trạng thái | Hoàn thành |
|--------|-----|------------|------------|
| 1 | Authentication | Hoàn thành | 100% |
| 2 | Goals CRUD | Hoàn thành | 100% |
| 3 | AI Learning Path Generation | Hoàn thành | 100% |
| 4 | Progress Tracking | Hoàn thành | 100% |
| 5 | AI Weekly Review | Chưa bắt đầu | 0% |
| 6 | Chat Assistant | Chưa bắt đầu | 0% |
| 7 | Resource Library | Chưa bắt đầu | 0% |
| 8 | Dashboard & Analytics | Chưa bắt đầu | 0% |

---

## Module 1 — Authentication `HOÀN THÀNH`

### Đã implement
- [x] NextAuth v4 — JWT strategy, PrismaAdapter
- [x] Credentials Provider (email + password, bcrypt hash)
- [x] Google OAuth (`allowDangerousEmailAccountLinking`)
- [x] Register API (`POST /api/auth/register`)
- [x] Email verification OTP khi đăng ký
- [x] Verify email page (`/verify-email`) — 6-box OTP, paste, resend
- [x] Forgot password flow (`/forgot-password`)
- [x] Reset password page (`/reset-password`) — OTP + new password
- [x] Login page — success banners (`?verified=1`, `?reset=1`)
- [x] Auth layout (`(auth)/layout.tsx`)
- [x] Dashboard layout bảo vệ bởi middleware
- [x] Dark/light mode toggle (`next-themes`)
- [x] Landing page (`/`)

### Files chính
```
src/lib/auth.ts
src/lib/otp.ts
src/lib/email.ts
src/app/api/auth/[...nextauth]/route.ts
src/app/api/auth/register/route.ts
src/app/api/auth/verify-email/route.ts
src/app/api/auth/resend-otp/route.ts
src/app/api/auth/forgot-password/route.ts
src/app/api/auth/reset-password/route.ts
src/app/(auth)/login/page.tsx
src/app/(auth)/register/page.tsx
src/app/(auth)/verify-email/page.tsx
src/app/(auth)/forgot-password/page.tsx
src/app/(auth)/reset-password/page.tsx
```

---

## Module 2 — Goals CRUD `HOÀN THÀNH`

### Đã implement
- [x] Prisma schema — model `Goal` (đã có từ initial migration)
- [x] `GET /api/goals` — list goals của user (có kèm `learning_path`)
- [x] `POST /api/goals` — tạo goal mới (validate title, description, level, hours_per_day, deadline)
- [x] `PATCH /api/goals/[id]` — cập nhật goal + đổi status (active/paused/completed)
- [x] `DELETE /api/goals/[id]` — xóa goal (cascade xóa learning path)
- [x] `/dashboard/goals` — trang list goal dạng card grid
- [x] `/dashboard/goals/new` — trang tạo goal với level selector button
- [x] Edit modal inline (không cần trang riêng)
- [x] Delete confirmation dialog
- [x] Dashboard overview hiển thị số liệu thực từ DB
- [x] NavLinks client component — active state theo pathname
- [x] TypeScript: 0 errors

### Files chính
```
src/app/api/goals/route.ts
src/app/api/goals/[id]/route.ts
src/app/(dashboard)/dashboard/goals/page.tsx
src/app/(dashboard)/dashboard/goals/new/page.tsx
src/components/nav-links.tsx
```

---

## Module 3 — AI Learning Path Generation `HOÀN THÀNH`

### Đã implement
- [x] Groq singleton (`src/lib/groq.ts`) — model `llama-3.3-70b-versatile`
- [x] Prompt template (`src/lib/prompts/learning-path.ts`) — builder function, calibrate theo level
- [x] `POST /api/goals/[id]/generate` — gọi Groq với `response_format: json_object`, parse, lưu DB
- [x] `GET /api/goals/[id]/path` — trả về `{ goal, path }` với phases + topics
- [x] `/dashboard/goals/[id]` — goal detail page: generate CTA, loading spinner, phases/topics display
- [x] Regenerate button (xóa path cũ, generate lại)
- [x] Goal cards trong list → link đến `/dashboard/goals/[id]` (cả khi đã có path lẫn chưa có)
- [x] TypeScript: 0 errors

### Files chính
```
src/lib/groq.ts
src/lib/prompts/learning-path.ts
src/app/api/goals/[id]/path/route.ts
src/app/api/goals/[id]/generate/route.ts
src/app/(dashboard)/dashboard/goals/[id]/page.tsx
```

### Model AI
- Generation: `llama-3.3-70b-versatile` (Groq)
- Output: structured JSON

---

## Module 4 — Progress Tracking `HOÀN THÀNH`

### Đã implement
- [x] `PATCH /api/topics/[id]/progress` — upsert ProgressLog (not_started/in_progress/completed), verify ownership qua chain topic→phase→path→goal
- [x] `GET /api/goals/[id]/progress` — trả về map `topicId → { status, completed_at }`
- [x] Goal detail page — checkbox toggle từng topic (optimistic update, revert on failure)
- [x] Per-phase progress bar (màu theo phase index)
- [x] Overall progress bar + stats (X/Y topics, %)
- [x] Topic completed → title gạch ngang, text mờ, bg nhẹ
- [x] Dashboard — streak thực từ DB (`calcStreak` dựa trên `completed_at` dates)
- [x] TypeScript: 0 errors

### Files chính
```
src/app/api/topics/[id]/progress/route.ts
src/app/api/goals/[id]/progress/route.ts
src/app/(dashboard)/dashboard/goals/[id]/page.tsx  (rewrite)
src/app/(dashboard)/dashboard/page.tsx             (streak)
```

### Streak algorithm
Đếm consecutive days (UTC) có ít nhất 1 topic hoàn thành. Nếu hôm nay chưa học → bắt đầu đếm từ hôm qua (không phạt khi ngày chưa kết thúc).

---

## Module 5 — AI Weekly Review `CHƯA BẮT ĐẦU`

### Mục tiêu
Hàng tuần AI phân tích tiến độ và đề xuất điều chỉnh kế hoạch.

### Cần implement
- [ ] `POST /api/review/generate` — gọi AI phân tích progress tuần
- [ ] Prompt template (`src/lib/prompts/weekly-review.ts`)
- [ ] `/dashboard/review` — hiển thị review + suggestions
- [ ] Lưu review history vào DB

---

## Module 6 — Chat Assistant `CHƯA BẮT ĐẦU`

### Mục tiêu
Chat Q&A context-aware: AI biết user đang học gì, tiến độ đến đâu.

### Cần implement
- [ ] Streaming API route (`POST /api/chat`)
- [ ] Prompt injection: user context (current goal, progress)
- [ ] Model: `llama-3.1-8b-instant` (Groq, nhanh)
- [ ] Chat UI component (`src/components/chat/`)
- [ ] Lưu conversation history

---

## Module 7 — Resource Library `CHƯA BẮT ĐẦU`

### Mục tiêu
AI gợi ý tài nguyên (video, bài viết, khoá học) cho từng topic.

### Cần implement
- [ ] `GET /api/topics/[id]/resources` — list resources
- [ ] AI gợi ý resource khi generate learning path
- [ ] User có thể bookmark resource
- [ ] Filter theo type (video / article / course)

---

## Module 8 — Dashboard & Analytics `CHƯA BẮT ĐẦU`

### Mục tiêu
Trang tổng hợp: số goal, tiến độ tổng, streak, biểu đồ học tập.

### Cần implement
- [ ] `GET /api/stats` — tổng hợp số liệu
- [ ] Widget: Goals active / completed
- [ ] Widget: Topics completed this week
- [ ] Widget: Current streak
- [ ] Chart: learning activity (TanStack Query + dữ liệu thật)

---

## Infrastructure & Tooling

- [x] Next.js 16.2.7 + React 19 + TypeScript strict
- [x] Tailwind CSS v4 + dark mode
- [x] Prisma v5 + MySQL 8 (Docker)
- [x] Jest + Testing Library (unit tests)
- [x] Git + GitHub (`toikobi401/learning-path-app`)
- [ ] AI SDK: Groq (`llama-3.3-70b`, `llama-3.1-8b-instant`)
- [ ] CI/CD (GitHub Actions)
- [ ] Deploy (Vercel + Railway/PlanetScale)

---

## Ghi chú kỹ thuật

| Vấn đề | Giải pháp |
|--------|-----------|
| Prisma v7 xóa native engine | Downgrade về v5.22.0 |
| Tailwind v4 dark mode | Thêm `@custom-variant dark` vào globals.css |
| NextAuth hydration warning | `suppressHydrationWarning` trên `<html>` |
| Google OAuth account conflict | `allowDangerousEmailAccountLinking: true` |
| Gemini API key lỗi (quota=0) | Disabled, dùng Groq thay thế |
| AI model | Groq `llama-3.3-70b-versatile` (generation), `llama-3.1-8b-instant` (chat) |
