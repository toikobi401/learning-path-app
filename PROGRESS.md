# PathAI — Tiến trình implement

> Cập nhật lần cuối: 2026-06-07 (Module 10 — i18n hoàn thành)

---

## Tổng quan

| Module | Tên | Trạng thái | Hoàn thành |
|--------|-----|------------|------------|
| 1 | Authentication | Hoàn thành | 100% |
| 2 | Goals CRUD | Hoàn thành | 100% |
| 3 | AI Learning Path Generation | Hoàn thành | 100% |
| 4 | Progress Tracking | Hoàn thành | 100% |
| 5 | AI Weekly Review | Hoàn thành | 100% |
| 6 | Chat Assistant | Hoàn thành | 100% |
| 7 | Resource Library | Hoàn thành | 100% |
| 8 | Dashboard & Analytics | Hoàn thành | 100% |
| 9 | Quiz System (MCQ + Essay + AI Grading) | Hoàn thành | 100% |
| 10 | Internationalization (i18n) — VI/EN | Hoàn thành | 100% |

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

## Module 5 — AI Weekly Review `HOÀN THÀNH`

### Đã implement
- [x] Prompt template (`src/lib/prompts/weekly-review.ts`) — phân tích phase-level, topics trong 7 ngày, tuần hiện tại của goal
- [x] `POST /api/review/generate` — gọi Groq `llama-3.3-70b-versatile`, upsert `WeeklyReview` (1 review/week/goal)
- [x] `GET /api/goals/[id]/reviews` — list review history của goal
- [x] `/dashboard/review` — goal selector + generate button + collapsible review cards
- [x] Review hiển thị: summary, strengths (xanh), challenges (vàng), next week adjustments (xanh dương), motivation quote
- [x] TypeScript: 0 errors

### Files chính
```
src/lib/prompts/weekly-review.ts
src/app/api/review/generate/route.ts
src/app/api/goals/[id]/reviews/route.ts
src/app/(dashboard)/dashboard/review/page.tsx
```

### Review JSON format
```json
{
  "summary": "...",
  "strengths": ["..."],
  "challenges": ["..."],
  "adjustments": ["..."],
  "motivation": "..."
}
```

---

## Module 6 — Chat Assistant `HOÀN THÀNH`

### Đã implement
- [x] `POST /api/chat` — streaming với Groq `llama-3.1-8b-instant`, context injection (goal info + phases + progress %)
- [x] Lưu user message trước khi stream, lưu assistant message sau khi stream kết thúc
- [x] `GET /api/goals/[id]/messages` — load history (100 messages gần nhất)
- [x] `DELETE /api/goals/[id]/messages` — xóa toàn bộ conversation của goal
- [x] `/dashboard/chat` — streaming UI real-time, goal selector, prompt suggestions, đọc `?goalId=` từ URL
- [x] Typing indicator (3 bouncing dots) khi AI đang trả lời
- [x] `Shift+Enter` cho newline, `Enter` để gửi
- [x] TypeScript: 0 errors

### Files chính
```
src/app/api/chat/route.ts
src/app/api/goals/[id]/messages/route.ts
src/app/(dashboard)/dashboard/chat/page.tsx
```

### Model AI
- Chat: `llama-3.1-8b-instant` (Groq, streaming, nhanh)
- Context: system prompt với goal info + phases + % tiến độ + 20 messages gần nhất

---

## Module 7 — Resource Library `HOÀN THÀNH`

### Đã implement
- [x] `GET /api/topics/[id]/resources` — list resources của topic (verify ownership qua chain)
- [x] `POST /api/topics/[id]/resources` — AI-generate 4–5 resources hoặc user thêm thủ công
- [x] AI tự động xóa resources cũ (ai_suggested) và replace khi regenerate
- [x] Goal detail page: "Resources ↓" toggle per topic, lazy load khi mở lần đầu
- [x] Type badges: article (xanh), video (đỏ), course (vàng), doc (xám)
- [x] "Generate AI resource suggestions" nếu topic chưa có resource
- [x] "Refresh" button để regenerate
- [x] TypeScript: 0 errors

### Files chính
```
src/app/api/topics/[id]/resources/route.ts
src/app/(dashboard)/dashboard/goals/[id]/page.tsx  (thêm ResourcesSection component)
```

---

## Module 8 — Dashboard & Analytics `HOÀN THÀNH`

### Đã implement
- [x] `GET /api/stats` — endpoint tổng hợp (goals breakdown, topics, hours, streak, recent activity)
- [x] Dashboard — 4 stat cards: Active goals, Topics completed, This week, Day streak
- [x] "Estimated hours studied" card (sum of completed topics' estimated_hrs)
- [x] Recent completions table (5 entries gần nhất, link đến goal)
- [x] Quick links: Weekly Review + Chat Assistant cards
- [x] NavLinks cập nhật: Overview | Goals | Review | Chat
- [x] TypeScript: 0 errors

### Files chính
```
src/app/api/stats/route.ts
src/app/(dashboard)/dashboard/page.tsx  (rewrite)
src/components/nav-links.tsx            (thêm Review + Chat links)
```

---

---

## Module 9 — Quiz System `HOÀN THÀNH`

### Đã implement
- [x] Schema: `PhaseQuiz` (unique per phase), `PhaseQuizQuestion` (MCQ + Essay), `PhaseQuizAttempt`, `PracticeAttempt`
- [x] Enums: `QuizDifficulty` (easy/medium/hard), `QuestionType` (mcq/essay)
- [x] **Auto-generate phase quiz** khi user generate learning path — `Promise.all` parallel, non-blocking
- [x] Prompt builder (`src/lib/prompts/quiz.ts`) — hỗ trợ difficulty, count, types (MCQ/Essay/Mixed)
- [x] AI grader prompt (`src/lib/prompts/quiz-grader.ts`) — batch grade essay answers, trả về score 0–10 + feedback
- [x] `GET /api/phases/[id]/quiz` — trả quiz + questions (ẩn correct_index/model_answer khỏi client)
- [x] `POST /api/phases/[id]/quiz/attempt` — MCQ auto-grade, Essay AI-grade (batch Groq call), lưu PhaseQuizAttempt
- [x] `POST /api/phases/[id]/practice` — generate practice questions với custom options, KHÔNG lưu DB
- [x] `POST /api/phases/[id]/practice/grade` — grade MCQ + AI grade Essay, lưu PracticeAttempt (score only)
- [x] UI: "Quiz" button trong header mỗi phase → QuizModal
- [x] Modal mode-select: Phase Quiz (official) vs Practice (custom options)
- [x] Practice settings: số câu (5/10/15/20), độ khó (easy/medium/hard), loại (MCQ/Essay/Mixed)
- [x] Navigation dots: xám = chưa làm, xanh = đã làm, pill = câu hiện tại
- [x] Essay: textarea per-question, state giữ nguyên khi chuyển câu
- [x] Grading spinner "AI is grading" → kết quả per-question: MCQ (correct/wrong + explanation), Essay (score/10 + AI feedback)
- [x] Lịch sử điểm past attempts (badge màu: xanh ≥80%, vàng ≥60%, đỏ <60%)
- [x] Retake (giữ nguyên questions) + Back to menu
- [x] TypeScript: 0 errors

### Files chính
```
src/lib/prompts/quiz.ts                              (rewrite)
src/lib/prompts/quiz-grader.ts                       (new)
src/app/api/phases/[id]/quiz/route.ts                (new — GET)
src/app/api/phases/[id]/quiz/attempt/route.ts        (new — POST grade + store)
src/app/api/phases/[id]/practice/route.ts            (new — POST generate)
src/app/api/phases/[id]/practice/grade/route.ts      (new — POST grade + store)
src/app/api/goals/[id]/generate/route.ts             (updated — auto phase quiz)
src/app/(dashboard)/dashboard/goals/[id]/page.tsx    (updated — QuizModal)
```

### Scoring logic
| Loại câu | Điểm tối đa | Cách tính |
|----------|-------------|-----------|
| MCQ | 1 điểm | server-side so sánh `chosen_index` vs `correct_index` |
| Essay | 10 điểm | Groq AI đọc bài + model_answer + tiêu chí, trả về 0–10 |
| Tổng | (sum earned / sum max) × 100 | Scale về 0–100% |

### Hai chế độ quiz
| | Phase Quiz | Practice Quiz |
|-|------------|---------------|
| Khi nào tạo | Auto khi generate path | User-triggered |
| Questions lưu DB | ✓ vĩnh viễn | ✗ state only |
| Score lưu DB | ✓ PhaseQuizAttempt | ✓ PracticeAttempt |
| Configurable | ✗ (7 câu, medium) | ✓ count/difficulty/types |

---

## Module 10 — Internationalization (i18n) `HOÀN THÀNH`

### Đã implement
- [x] Schema: `UserSettings` model (user_id unique, ui_language, ai_language, default "vi")
- [x] `GET /api/settings` — trả settings hiện tại, fallback mặc định "vi"
- [x] `PATCH /api/settings` — upsert settings, validate lang ∈ ["vi", "en"]
- [x] `translations.ts` — dictionary đầy đủ vi/en cho tất cả màn hình (nav, dashboard, goals, new goal, goal detail, review, chat, quiz, settings, common)
- [x] `LanguageProvider` — React context + `useLanguage()` hook, `initialLang` từ server
- [x] `getServerTranslations(userId)` — server-side helper cho Server Components, try-catch graceful fallback "vi"
- [x] `getAiLanguageInstruction(lang)` — cho prose output (chat)
- [x] `getAiJsonLanguageInstruction(lang)` — cho JSON output, giữ nguyên key, chỉ dịch value → fix 502 khi regenerate path với AI language = VI
- [x] `/dashboard/settings` — trang cài đặt: chọn UI language + AI language, save → update context ngay
- [x] Hover dropdown avatar — Profile / Settings / Sign out (dùng `t.common.*`)
- [x] Tất cả màn hình áp dụng i18n: dashboard, goals list, new goal, goal detail (+ QuizModal + ResourcesSection), review, chat
- [x] `layout.tsx` — wrap `LanguageProvider` với `initialLang` fetch từ DB server-side
- [x] Fix: AI JSON generation routes (`generate`, `practice`, `practice/grade`, `quiz/attempt`, `review/generate`) dùng `getAiJsonLanguageInstruction`

### Files chính
```
src/lib/i18n/translations.ts          (new — dictionary vi/en)
src/lib/i18n/context.tsx              (new — LanguageProvider + useLanguage)
src/lib/i18n/server.ts                (new — getServerTranslations)
src/lib/i18n/ai-language.ts           (new — language instruction helpers)
src/app/api/settings/route.ts         (new — GET/PATCH settings)
src/app/(dashboard)/dashboard/settings/page.tsx  (new — settings page)
src/app/(dashboard)/layout.tsx        (updated — LanguageProvider wrap)
src/components/user-avatar-header.tsx (updated — hover dropdown + i18n)
src/components/nav-links.tsx          (updated — i18n)
src/app/(dashboard)/dashboard/page.tsx           (updated — i18n server)
src/app/(dashboard)/dashboard/goals/page.tsx     (updated — i18n client)
src/app/(dashboard)/dashboard/goals/new/page.tsx (updated — i18n client)
src/app/(dashboard)/dashboard/goals/[id]/page.tsx(updated — i18n + QuizModal + ResourcesSection)
src/app/(dashboard)/dashboard/review/page.tsx    (updated — i18n client)
src/app/(dashboard)/dashboard/chat/page.tsx      (updated — i18n client)
prisma/schema.prisma                  (updated — UserSettings model)
```

### Kiến trúc i18n
```
Server Component → getServerTranslations(userId) → DB → initialLang
                                                         ↓
Client → LanguageProvider(initialLang) → useLanguage() → t.section.key
                                                         ↓
AI route → getAiJsonLanguageInstruction(lang) → Groq prompt suffix
```

### Fix bug quan trọng
Khi AI language = VI, instruction "trả lời hoàn toàn bằng tiếng Việt" khiến model dịch cả JSON key
(`phases` → `các_giai_đoạn`) → 502 "invalid structure".
Fix: tách thành `getAiJsonLanguageInstruction()` — chỉ dịch string value, giữ nguyên JSON key.

---

## Infrastructure & Tooling

- [x] Next.js 16.2.7 + React 19 + TypeScript strict
- [x] Tailwind CSS v4 + dark mode
- [x] Prisma v5 + MySQL 8 (Docker)
- [x] Jest + Testing Library (unit tests)
- [x] Git + GitHub (`toikobi401/learning-path-app`)
- [x] AI SDK: Groq (`llama-3.3-70b-versatile` generation, `llama-3.1-8b-instant` chat)
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
