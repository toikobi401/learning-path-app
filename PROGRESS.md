# PathAI — Tiến trình implement

> Cập nhật lần cuối: 2026-06-26 (Đồng bộ tài liệu với codebase thực tế)

---

## Tổng quan

| Module | Tên | Trạng thái | Hoàn thành |
|--------|-----|------------|------------|
| 1 | Authentication | Hoàn thành | 100% |
| 2 | Goals CRUD | Hoàn thành | 100% |
| 3 | AI Learning Path Generation | Hoàn thành | 100% |
| 4 | Progress Tracking | Hoàn thành | 100% |
| 5 | AI Weekly Review | Hoàn thành | 100% |
| 6 | Chat Assistant (multi-conversation) | Hoàn thành | 100% |
| 7 | Resource Library | Hoàn thành | 100% |
| 8 | Dashboard & Analytics | Hoàn thành | 100% |
| 9 | Quiz System (MCQ + Essay + AI Grading) | Hoàn thành | 100% |
| 10 | Internationalization (i18n) — VI/EN | Hoàn thành | 100% |
| 11 | User Profile & Avatar Upload | Hoàn thành | 100% |
| 12 | Floating Chat Widget | Hoàn thành | 100% |
| 13 | UI/UX Polish — Motion layer | Hoàn thành | 100% |
| 14 | Multi-Provider AI (Groq/Anthropic/Google/OpenAI/Custom) | Hoàn thành | 100% |
| | **Roadmap — Tăng tương tác & giá trị học tập** | | |
| 15 | Bài giảng AI theo topic ("Học ngay") ⭐ | Hoàn thành | 100% |
| 16 | Ghi chú theo topic | Hoàn thành | 100% |
| 17 | Daily Check-in + nhật ký học | Hoàn thành | 100% |
| 18 | Hỏi AI ngay tại topic | Hoàn thành | 100% |
| 19 | "Hôm nay học gì" — kế hoạch theo ngày | Chưa bắt đầu | 0% |
| 20 | Ôn tập lặp lại ngắt quãng (spaced repetition) | Chưa bắt đầu | 0% |
| 21 | Weekly Review "có hành động" | Chưa bắt đầu | 0% |
| 22 | Email nhắc học / giữ streak | Chưa bắt đầu | 0% |
| 23 | Bài tập / dự án thực hành theo phase | Chưa bắt đầu | 0% |
| 24 | Gamification (XP / huy hiệu / chứng chỉ) | Chưa bắt đầu | 0% |
| 25 | Sơ đồ phụ thuộc topic (prerequisite map) | Chưa bắt đầu | 0% |
| 26 | Deploy — Vercel + Railway MySQL | Đang thực hiện | 0% |

> **Lưu ý đồng bộ (2026-06-27):** Module 14 (Multi-Provider AI) đã hoàn thành.
> Thêm Roadmap M15–M25 (3 nhóm tăng tương tác học tập, xem chi tiết cuối file).
> Deploy dời thành Module 26.

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

## Module 6 — Chat Assistant (multi-conversation) `HOÀN THÀNH`

> **Cập nhật kiến trúc:** Chat đã chuyển từ mô hình "1 hội thoại / goal" sang
> **multi-conversation** — model `Conversation` riêng, mỗi user có nhiều hội thoại,
> có hoặc không gắn với goal. Sidebar nhóm hội thoại theo Hôm nay / Hôm qua /
> 7 ngày qua / Cũ hơn (`groupConversations`).

### Đã implement
- [x] Schema: model `Conversation` (user_id, goal_id nullable, title), `ChatMessage.conversation_id`
- [x] `GET /api/conversations` — list hội thoại của user (kèm goal title + last message), filter `?widget=true` (chỉ hội thoại không gắn goal)
- [x] `POST /api/conversations` — tạo hội thoại mới (validate goal ownership nếu có goal_id)
- [x] `PATCH /api/conversations/[id]` — đổi tên hội thoại (rename)
- [x] `DELETE /api/conversations/[id]` — xóa hội thoại (cascade messages)
- [x] `GET /api/conversations/[id]/messages` — load messages của 1 hội thoại
- [x] `POST /api/chat` — streaming với Groq `llama-3.1-8b-instant`, context injection (goal info + phases + progress %)
- [x] Lưu user message trước khi stream, lưu assistant message sau khi stream kết thúc
- [x] `/dashboard/chat` — sidebar danh sách hội thoại (nhóm theo thời gian), streaming UI real-time, goal selector, prompt suggestions, đọc `?goalId=` từ URL
- [x] Typing indicator (3 bouncing dots) khi AI đang trả lời
- [x] `Shift+Enter` cho newline, `Enter` để gửi
- [x] TypeScript: 0 errors

### Files chính
```
src/app/api/chat/route.ts
src/app/api/conversations/route.ts                  (list + create)
src/app/api/conversations/[id]/route.ts             (rename + delete)
src/app/api/conversations/[id]/messages/route.ts    (load messages)
src/app/(dashboard)/dashboard/chat/page.tsx
```

> Route cũ `src/app/api/goals/[id]/messages/route.ts` vẫn còn (history theo goal),
> nhưng UI chat chính giờ dùng `Conversation`.

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
- [x] Schema: `UserSettings` model (user_id unique, ui_language, ai_language default "vi", `show_chat_widget` default true)
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

## Module 11 — User Profile & Avatar Upload `HOÀN THÀNH`

### Đã implement
- [x] Schema: `User.avatar_url`, `User.provider` (email/google)
- [x] `GET /api/user` — trả profile hiện tại (name, email, avatar_url, provider, created_at)
- [x] `PATCH /api/user` — cập nhật name và/hoặc avatar
- [x] `POST /api/upload` — upload ảnh lên Cloudinary (validate type JPEG/PNG/WebP/GIF, max 5 MB)
- [x] `src/lib/cloudinary.ts` — wrapper upload/delete Cloudinary
- [x] `/dashboard/profile` — trang chỉnh sửa profile + đổi avatar
- [x] Avatar hiển thị ở header dropdown (`user-avatar-header.tsx`)
- [x] Zustand user store (`src/lib/stores/user-store.ts`) — đồng bộ state user client-side

### Files chính
```
src/lib/cloudinary.ts
src/lib/stores/user-store.ts
src/app/api/user/route.ts
src/app/api/upload/route.ts
src/app/(dashboard)/dashboard/profile/page.tsx
src/components/user-avatar-header.tsx
```

---

## Module 12 — Floating Chat Widget `HOÀN THÀNH`

### Đã implement
- [x] `src/components/chat-widget.tsx` — nút chat nổi góc màn hình, mở panel chat nhanh
- [x] Dùng widget conversation riêng (goal_id = null), load hội thoại gần nhất khi mở lần đầu
- [x] Streaming real-time, reuse `POST /api/chat` + `/api/conversations`
- [x] Bật/tắt qua setting `UserSettings.show_chat_widget` (mặc định bật)
- [x] `GET/PATCH /api/settings` đã hỗ trợ field `show_chat_widget`

### Files chính
```
src/components/chat-widget.tsx
src/app/api/settings/route.ts        (field show_chat_widget)
prisma/schema.prisma                 (UserSettings.show_chat_widget)
```

---

## Module 13 — UI/UX Polish — Motion Layer `HOÀN THÀNH`

### Đã implement
- [x] Bộ component hiệu ứng/animation (`src/components/motion/`)
- [x] `aurora.tsx`, `particles.tsx`, `cursor-field.tsx`, `site-background.tsx` — background động
- [x] `reveal.tsx` — scroll reveal, `scroll-progress.tsx` — thanh tiến độ cuộn
- [x] `tilt-card.tsx`, `magnetic-button.tsx` — micro-interaction
- [x] `count-up.tsx` — số đếm tăng dần (stat cards)
- [x] `@vercel/analytics` — web analytics

### Files chính
```
src/components/motion/aurora.tsx
src/components/motion/particles.tsx
src/components/motion/cursor-field.tsx
src/components/motion/site-background.tsx
src/components/motion/reveal.tsx
src/components/motion/scroll-progress.tsx
src/components/motion/tilt-card.tsx
src/components/motion/magnetic-button.tsx
src/components/motion/count-up.tsx
```

---

## Module 14 — Multi-Provider AI `HOÀN THÀNH`

> Thay lớp gọi Groq cố định bằng abstraction đa-provider; user tự nhập API key
> (mã hóa trong DB) và chọn model cho từng task trên UI; có auto-fallback.

### Đã implement
- [x] Schema: enum `AiProvider`, model `UserAiCredential` (key mã hóa, per-user), `UserSettings.ai_generation_model` + `ai_chat_model`
- [x] `src/lib/crypto.ts` — AES-256-GCM mã hóa/giải mã API key (`ENCRYPTION_KEY` hoặc derive từ `NEXTAUTH_SECRET`)
- [x] `src/lib/ai/` — `index` (aiComplete/aiStream), `registry`, `resolve`, `providers/*` (openai-compatible, anthropic, google)
- [x] Refactor 7 call site từ `groq.chat.completions.create` → `aiComplete`/`aiStream`; xóa `src/lib/groq.ts`
- [x] API: `/api/ai/providers`, `/api/ai/credentials` (GET/POST/DELETE), mở rộng `/api/settings` (generation/chat model)
- [x] UI Settings: section "AI Models & Providers" (quản lý key + chọn model) + i18n vi/en
- [x] Dep: thêm `openai`; `@anthropic-ai/sdk` + `@google/generative-ai` chuyển sang dùng thật
- [x] Migration `20260626000000_add_ai_providers`; build + test pass

### Provider hỗ trợ
`groq` (mặc định/fallback) · `anthropic` (Claude) · `google` (Gemini) · `openai` (GPT) · `custom` (OpenAI-compatible base URL)

### Files chính
```
src/lib/crypto.ts
src/lib/ai/{index,registry,resolve,types}.ts
src/lib/ai/providers/{openai-compatible,anthropic,google}.ts
src/app/api/ai/providers/route.ts
src/app/api/ai/credentials/route.ts
src/components/ai-provider-settings.tsx
```

> **Cần env trước khi dùng:** `GROQ_API_KEY` (bắt buộc — fallback), `ENCRYPTION_KEY`.

---

## Roadmap — Tăng tương tác & giá trị học tập `ĐANG LÊN KẾ HOẠCH`

> Mục tiêu tổng: biến trang goal-detail từ "danh sách việc" thành **không gian học
> thực sự** + đồng hành trong quá trình học. Chia 3 nhóm theo tỉ lệ giá trị/công sức.
> Trạng thái khởi điểm: tất cả `Chưa bắt đầu` (cập nhật 2026-06-27).

### Nhóm A — Tận dụng hạ tầng sẵn có `HOÀN THÀNH`

#### M15 — Bài giảng AI theo topic ("Học ngay") ⭐ `HOÀN THÀNH`
- [x] Schema: model `TopicLesson` (1-1 topic, cache markdown) + migration `20260627000000_add_topic_lesson`
- [x] Prompt builder `src/lib/prompts/lesson.ts` (khái niệm + ý chính + ví dụ + lỗi thường gặp + bài tập, theo level)
- [x] `POST /api/topics/[id]/lesson` — sinh & cache (upsert); `GET` trả bài giảng đã có
- [x] Dùng `aiComplete` qua lớp đa-provider (Module 14) + `getAiLanguageInstruction`
- [x] **Trang học riêng** `/dashboard/goals/[id]/topics/[topicId]`: nút "Học" ở trang mục tiêu điều hướng
  sang trang chuyên dụng (bài giảng cỡ lớn + ghi chú + tài nguyên + hỏi AI + điều hướng chủ đề trước/tiếp)
  thay cho hiển thị inline, cho nhiều không gian tương tác hơn
- [x] **Hoàn thành bằng bài kiểm tra:** thay nút "đánh dấu hoàn thành" bằng **trắc nghiệm AI** sinh từ nội
  dung bài giảng (`POST /api/topics/[id]/quiz`, prompt `src/lib/prompts/topic-quiz.ts`, component
  `topic-quiz.tsx`) — đúng ≥70% mới tự đánh dấu hoàn thành; có giải thích từng câu + làm lại; vẫn giữ
  tùy chọn đánh dấu thủ công

#### M16 — Ghi chú theo topic `HOÀN THÀNH`
- [x] `PATCH /api/topics/[id]/progress` đọc/ghi `note` (status optional); `GET /api/goals/[id]/progress` trả note
- [x] UI: `NoteSection` textarea "📝 Ghi chú" mỗi topic, autosave debounce 700ms
- [x] i18n vi/en

#### M17 — Daily Check-in + nhật ký học `HOÀN THÀNH`
- [x] `POST /api/checkins` (upsert user+goal+date hôm nay), `GET /api/checkins?goalId=` (today + history 30 ngày)
- [x] `CheckinCard` "Hôm nay học thế nào?" (giờ học + mood emoji) trên goal-detail
- [x] i18n vi/en
- [ ] (mở rộng sau) Dashboard biểu đồ giờ học/tâm trạng theo thời gian

#### M18 — Hỏi AI ngay tại topic `HOÀN THÀNH`
- [x] UI: nút "💬 Hỏi AI" mỗi topic → `/dashboard/chat?goalId=&q=...` (seed câu hỏi về topic)
- [x] Chat page đọc `?q=` để prefill input; reuse `POST /api/chat` + conversation theo goal

### Nhóm B — Tăng tương tác & giữ chân

#### M19 — "Hôm nay học gì" — kế hoạch theo ngày
- [ ] Thuật toán chia topic theo `week_number` + `hours_per_day` thành buổi học/ngày
- [ ] View "Today" + chỉ báo tiến độ so với `deadline` (đúng tiến độ / trễ X ngày)

#### M20 — Ôn tập lặp lại ngắt quãng (spaced repetition)
- [ ] Schema: lịch ôn (next_review_at theo topic đã hoàn thành, khoảng 3/7/14 ngày)
- [ ] Job/route nhắc ôn + vài câu quiz nhanh (reuse quiz engine)
- [ ] UI: mục "Cần ôn tập hôm nay"

#### M21 — Weekly Review "có hành động"
- [ ] Nút "Áp dụng điều chỉnh" trên review → AI cập nhật lại path (giãn/dồn topic theo tiến độ)
- [ ] Lưu lịch sử thay đổi path

#### M22 — Email nhắc học / giữ streak
- [ ] Reuse `nodemailer`; cron/scheduled gửi nhắc "chưa học hôm nay" + tóm tắt tuần
- [ ] Cài đặt bật/tắt nhắc trong Settings

#### M27 — Đồng hồ tập trung Pomodoro `HOÀN THÀNH` (bổ sung, tham khảo studiestimer.com)
- [x] Schema `StudySession` (phút tập trung/user) + cấu hình Pomodoro trong `UserSettings`
- [x] `POST/GET /api/study-sessions` — ghi nhận buổi tập trung + thống kê cá nhân (hôm nay/tuần/tổng)
- [x] **Widget nổi `PomodoroWidget`** (góc trên-phải, dưới navbar, giống chat widget): đặt thời gian
  focus/break, đếm ngược, tự log khi xong 1 phiên focus; **giữ chạy khi thu nhỏ** (pill hiện mm:ss),
  chọn mục tiêu, thống kê hôm nay, link leaderboard, chỉnh cấu hình. Mount toàn cục ở dashboard layout
- [x] Mở từ nơi khác qua sự kiện `pomodoro:open` (nút ở trang học & leaderboard). Đã bỏ trang `/dashboard/focus`
- [x] i18n vi/en

#### M28 — Bảng xếp hạng (Leaderboard) `HOÀN THÀNH` (bổ sung)
- [x] `GET /api/leaderboard?range=today|week|all` — tổng phút học theo user + hạng của tôi
- [x] Tôn trọng quyền riêng tư: `leaderboard_opt_in` (bật/tắt hiển thị) trong Settings
- [x] Trang `/dashboard/leaderboard`: top học viên + vị trí của tôi (hôm nay/tuần/tổng)
- [x] i18n vi/en

### Nhóm C — Giá trị thực tiễn & động lực

#### M23 — Bài tập / dự án thực hành theo phase
- [ ] AI sinh mini-project + checklist tiêu chí
- [ ] Nộp bài → AI chấm (reuse cơ chế chấm essay Module 9)

#### M24 — Gamification
- [ ] XP/huy hiệu theo topic + milestone
- [ ] "Chứng chỉ hoàn thành goal"

#### M25 — Sơ đồ phụ thuộc topic (prerequisite map)
- [ ] Schema/metadata prerequisite giữa các topic
- [ ] Trực quan hóa lộ trình dạng bản đồ

---

## Infrastructure & Tooling

- [x] Next.js 16.2.7 + React 19 + TypeScript strict
- [x] Tailwind CSS v4 + dark mode
- [x] Prisma v5 + MySQL 8 (Docker)
- [x] Jest + Testing Library (unit tests)
- [x] Git + GitHub (`toikobi401/learning-path-app`)
- [x] AI SDK: Groq (`llama-3.3-70b-versatile` generation, `llama-3.1-8b-instant` chat)
- [x] State: Zustand (client store)
- [x] Media: Cloudinary (avatar upload)
- [x] Analytics: `@vercel/analytics`
- [ ] CI/CD (GitHub Actions)
- [ ] Deploy — Vercel + Railway MySQL (xem [deploy_progress.md](deploy_progress.md)) — **Module 26**

> **AI providers:** `@anthropic-ai/sdk` và `@google/generative-ai` đã có sẵn và sẽ được
> dùng thật khi hoàn thành Module 14 (đa-provider). CLAUDE.md đã cập nhật mô tả kiến trúc
> đa-provider (Groq mặc định, không còn ghi cứng `claude-sonnet-4-6`).

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
