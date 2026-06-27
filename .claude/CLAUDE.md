# Learning Path App — Project Context

## Project Overview
Personalized Learning Path Generator — web app giúp người dùng tạo lộ trình học tập cá nhân hóa bằng AI.

## Tech Stack
- **Frontend/Backend:** Next.js 16 (App Router), React 19, TypeScript strict
- **Styling:** Tailwind CSS v4 + dark mode (`next-themes`)
- **Database:** MySQL 8 via Prisma ORM (v5)
- **Auth:** NextAuth.js v4 (Email + Google OAuth, JWT strategy)
- **LLM:** Lớp **đa-provider** (`src/lib/ai/`) — Groq (mặc định), Anthropic, Google Gemini,
  OpenAI, và provider **custom** (endpoint OpenAI-compatible). Model chọn được per-user.
- **State:** Zustand (client store)
- **Media:** Cloudinary (avatar upload)
- **Infra:** Docker Compose (MySQL), Git

## Folder Structure
```
src/
  app/              # Next.js App Router pages
    (auth)/         # login, register
    (dashboard)/    # protected pages
    api/            # API routes
  components/
    ui/             # shadcn/ui base components
    path/           # LearningPath specific components
    chat/           # Chat components
    dashboard/      # Dashboard widgets
  lib/
    prisma.ts       # Prisma client singleton
    crypto.ts       # AES-256-GCM encrypt/decrypt cho API key người dùng
    ai/             # Lớp AI đa-provider (index, registry, resolve, providers/*)
    prompts/        # LLM prompt templates
  types/            # Shared TypeScript types
prisma/
  schema.prisma     # Database schema
docker-compose.yml
```

## Database
- File: `prisma/schema.prisma`
- Connection: `DATABASE_URL` in `.env`
- Run migrations: `npx prisma migrate dev`
- View data: `npx prisma studio`

## Environment Variables (`.env`)
```
DATABASE_URL          # MySQL connection string
NEXTAUTH_URL          # http://localhost:3000
NEXTAUTH_SECRET       # random secret (cũng dùng fallback derive ENCRYPTION_KEY)
GOOGLE_CLIENT_ID      # Google OAuth
GOOGLE_CLIENT_SECRET
ENCRYPTION_KEY        # 32-byte key (base64/hex) mã hóa API key người dùng trong DB
GROQ_API_KEY          # Key Groq cấp hệ thống — provider mặc định + fallback
CLOUDINARY_CLOUD_NAME # Cloudinary (avatar upload)
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
EMAIL_USER            # SMTP (OTP email)
EMAIL_PASS
EMAIL_FROM
# Tùy chọn — key cấp hệ thống cho provider khác (không bắt buộc, user có thể tự nhập trên UI):
# ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_AI_API_KEY
```

> **API key người dùng** được lưu **mã hóa** trong bảng `UserAiCredential` (per-user), không phải env.
> Env chỉ giữ key **cấp hệ thống** làm mặc định/fallback (tối thiểu `GROQ_API_KEY`).

## Dev Commands
```bash
docker compose up -d                        # start MySQL
npm run dev                                 # start Next.js dev server
npx prisma migrate dev --name <name>        # run migrations
npx prisma studio                           # open DB GUI
npx prisma generate                         # regenerate client after schema change
```

## Breaking Changes đã gặp
- **Prisma v7:** `url` trong `schema.prisma` bị xóa → dùng `prisma.config.ts`
- **Next.js 16:** `middleware.ts` đổi tên thành `proxy.ts`
- **Prisma v7:** Phải chạy `npx prisma generate` trước khi TypeScript check

## Key Conventions
- API routes: `/src/app/api/<resource>/route.ts`
- Server components by default; add `"use client"` only when needed
- Prisma queries only in API routes or Server Components, never in client components
- LLM calls always in API routes (server-side), never expose API key to client
- **Mọi call LLM đi qua `src/lib/ai`** (`aiComplete` / `aiStream`), KHÔNG gọi SDK provider trực tiếp
- API key người dùng phải mã hóa qua `src/lib/crypto.ts` trước khi lưu; chỉ trả về client dạng masked
- All LLM prompts stored in `src/lib/prompts/`

## Modules & Priority
1. **Auth** (Module 1) — NextAuth, login/register
2. **Goals** (Module 2) — CRUD goals
3. **Learning Path Generation** (Module 3) — Core AI feature ⭐
4. **Progress Tracking** (Module 4) — check-in, streak
5. **AI Weekly Review** (Module 5) — adaptive planning
6. **Chat Assistant** (Module 6) — context-aware Q&A
7. **Resource Library** (Module 7)
8. **Dashboard & Analytics** (Module 8)

## LLM Usage — Kiến trúc đa-provider (`src/lib/ai/`)

Tất cả tính năng AI gọi qua một lớp trừu tượng thống nhất, không phụ thuộc 1 provider:

```
src/lib/ai/
  index.ts        # aiComplete(userId, task, opts) -> string  |  aiStream(userId, task, opts) -> AsyncIterable<string>
  registry.ts     # catalog provider + model (cho UI) + system defaults
  resolve.ts      # userId + task -> chuỗi ứng viên {provider, model, apiKey, baseUrl} (primary + fallback)
  providers/
    openai-compatible.ts  # groq | openai | custom (qua baseURL)
    anthropic.ts          # Claude (claude-opus-4-8 / claude-sonnet-4-6 / claude-haiku-4-5)
    google.ts             # Gemini
```

- **Provider hỗ trợ:** `groq` (mặc định), `anthropic`, `google`, `openai`, `custom` (OpenAI-compatible base URL).
- **Task:** `generation` (path/quiz/review/resources/grading — JSON output) và `chat` (streaming).
- **Chọn model:** mỗi user chọn model cho từng task trên UI Settings, lưu ở
  `UserSettings.ai_generation_model` / `ai_chat_model` (dạng `"provider:modelId"`). Null → default hệ thống.
- **Key:** đọc từ `UserAiCredential` (giải mã) theo provider; nếu thiếu → dùng key hệ thống trong env.
- **Fallback tự động:** lỗi provider chính → thử ứng viên kế tiếp; bảo đảm cuối chuỗi luôn là
  **Groq + `GROQ_API_KEY` hệ thống** để app không bao giờ chết.
- Default models: `groq:llama-3.3-70b-versatile` (generation), `groq:llama-3.1-8b-instant` (chat).
- Prompts vẫn ở `src/lib/prompts/`; JSON-language instruction qua `src/lib/i18n/ai-language.ts`.

> Lưu ý: SDK Claude (`@anthropic-ai/sdk`) — `messages.create` tách `system` khỏi messages, `max_tokens` bắt buộc.
> Khi sửa provider Anthropic, đọc skill `claude-api` để dùng đúng API + model id mới nhất.

# Skills — Bản đồ định tuyến (Skill Routing Map)

Thư viện skill đầy đủ nằm ở `.claude/skills/` (~73 skill). Bảng dưới **chỉ map các skill
liên quan stack của dự án** — khi bắt đầu một task, chọn skill phù hợp theo bảng (ưu tiên
skill **project-specific** ở Tier 1 vì chúng đã chứa convention riêng của repo này).
Quy tắc: gặp xung đột → skill Tier 1 thắng skill generic; làm feature đụng nhiều lớp →
ghép nhiều skill.

## Tier 1 — Project-specific (luôn ưu tiên)
| Skill | Khi nào dùng | Vùng code |
|---|---|---|
| `nextjs-app-router` | Routing, layout, Server/Client Component, API route, streaming | `src/app/**` |
| `prisma-mysql` | Schema, migration, query Prisma, thao tác DB | `prisma/`, `src/lib/prisma.ts` |
| `nextauth-v4` | Auth, session, login/register, protected route, OAuth | `(auth)/`, NextAuth config |
| `claude-api-integration` | AI feature: sinh lộ trình, chat, weekly review (JSON/streaming) | `src/lib/ai/`, `src/lib/prompts/` |

## Tier 2 — Ngôn ngữ & framework của stack
| Skill | Khi nào dùng |
|---|---|
| `typescript-pro` | Generics nâng cao, utility/conditional types, type guard, type an toàn end-to-end |
| `react-expert` | Component React 19, custom hook, Suspense, debug render, `useActionState` |
| `nextjs-developer` | Next.js generic (Server Actions, metadata/SEO, middleware) — *fallback khi `nextjs-app-router` chưa đủ* |
| `javascript-pro` | Logic JS thuần, async/Promise, tối ưu runtime (ít dùng — dự án là TS) |
| `sql-pro` | Query SQL phức tạp, window function, CTE, thiết kế/migrate schema mức SQL |
| `database-optimizer` | Query MySQL chậm, phân tích EXPLAIN, thiết kế index, tuning |
| `prompt-engineer` | Viết/refactor prompt LLM, schema JSON output, few-shot, eval prompt |
| `rag-architect` | (Tùy chọn) thêm semantic search / retrieval cho gợi ý tài nguyên |

## Tier 3 — Chất lượng, bảo mật, kiểm thử, quy trình
| Skill | Khi nào dùng |
|---|---|
| `secure-code-guardian` | Khi *viết* code auth/validation: bcrypt, Zod, CORS/CSP, JWT, chống OWASP Top 10 |
| `security-reviewer` | Khi *audit* bảo mật: quét lỗ hổng, secrets, dependency, report theo severity |
| `code-reviewer` | Review PR/diff: bug, code smell, N+1, đặt tên, kiến trúc |
| `fullstack-guardian` | Làm feature xuyên suốt DB→API→UI có bảo mật từng lớp (CRUD + form) |
| `test-master` | Viết unit/integration test, mock, chiến lược test, phân tích coverage |
| `playwright-expert` | Test E2E trình duyệt, page object, mock API, visual regression |
| `debugging-wizard` | Truy nguyên nhân bug khó: stack trace, log, hypothesis-driven |
| `api-designer` | Thiết kế REST API: resource modeling, versioning, pagination, error format |
| `architecture-designer` | Thiết kế hệ thống mức cao, viết ADR, đánh đổi công nghệ, scalability |
| `feature-forge` | Định nghĩa feature mới: user story, EARS spec, acceptance criteria, PRD |
| `code-documenter` | Docstring, OpenAPI/Swagger, JSDoc, trang tài liệu, hướng dẫn |
| `devops-engineer` | Dockerfile, CI/CD, deploy (dự án dùng Docker Compose cho MySQL) |
| `the-fool` | Phản biện kế hoạch/quyết định: devil's advocate, pre-mortem, red-team |
| `learning-script-writer` | Soạn nội dung học tập/kịch bản dạy (domain giáo dục của app) |

## Mapping theo Module (xem `## Modules & Priority`)
- **M1 Auth** → `nextauth-v4` + `secure-code-guardian` (+ `nextjs-app-router` cho route bảo vệ)
- **M2 Goals (CRUD)** → `nextjs-app-router` + `prisma-mysql` (+ `fullstack-guardian` cho luồng DB→UI)
- **M3 Learning Path Generation ⭐** → `claude-api-integration` + `prompt-engineer` + `prisma-mysql`
- **M4 Progress Tracking** → `prisma-mysql` + `nextjs-app-router` (+ `database-optimizer` nếu query streak chậm)
- **M5 AI Weekly Review** → `claude-api-integration` + `prompt-engineer`
- **M6 Chat Assistant** → `claude-api-integration` (streaming) + `react-expert`
- **M7 Resource Library** → `prisma-mysql` + (tùy chọn) `rag-architect` cho gợi ý theo ngữ nghĩa
- **M8 Dashboard & Analytics** → `react-expert` + `sql-pro`/`database-optimizer` (aggregation)
- **Xuyên suốt** → `code-reviewer`, `test-master`, `security-reviewer`, `debugging-wizard`

## KHÔNG dùng cho dự án này (ngoài stack — bỏ qua dù tên nghe liên quan)
Frontend khác: `angular-architect`, `vue-expert(-js)`, `flutter-expert`, `react-native-expert`, `swift-expert`, `kotlin-specialist`.
Backend/ngôn ngữ khác: `django-expert`, `fastapi-expert`, `laravel-specialist`, `rails-expert`, `nestjs-expert`, `spring-boot-engineer`, `java-architect`, `php-pro`, `golang-pro`, `rust-engineer`, `cpp-pro`, `csharp-developer`, `dotnet-core-expert`.
Hạ tầng/nền tảng khác: `postgres-pro` (dự án dùng MySQL), `kubernetes-specialist`, `terraform-engineer`, `cloud-architect`, `sre-engineer`, `chaos-engineer`, `monitoring-expert`, `microservices-architect`, `graphql-architect`, `websocket-engineer`, `mcp-developer`, `atlassian-mcp`, `spec-miner`, `legacy-modernizer`, `cli-developer`, `salesforce-developer`, `shopify-expert`, `wordpress-pro`, `game-developer`, `embedded-systems`, `pandas-pro`, `spark-engineer`, `ml-pipeline`, `fine-tuning-expert`.

# RULE: Knowledge Persistence (Tri thức bền vững)

Bạn có một "bộ nhớ ngoài" dạng file tại thư mục `.ai/`. Mục tiêu: **tái dùng tri thức
đã có để tiết kiệm context, không điều tra lại từ đầu mỗi session.**

## Nguyên tắc cốt lõi
1. **ĐỌC TRƯỚC KHI LÀM.** Trước khi bắt đầu BẤT KỲ tác vụ nào (sửa bug, thêm feature,
   refactor, trả lời câu hỏi về codebase), mở `.ai/AGENT.md` (file index) và đọc các
   file liên quan. Đừng grep/đọc lại cả codebase nếu tri thức đã có sẵn ở đây.
2. **GHI SAU KHI LÀM.** Sau khi hoàn thành một việc tạo ra tri thức đáng tái dùng
   (xong root-cause một bug, hiểu một luồng dữ liệu, ra một quyết định kỹ thuật, thay
   đổi đáng kể), hãy ghi lại thành 1 file trong thư mục con phù hợp + cập nhật index.
3. **MỘT FILE = MỘT CHỦ ĐỀ.** File ngắn, súc tích, có hook để tìm lại. Không nhồi nhiều
   chủ đề vào một file.
4. **CẬP NHẬT, KHÔNG NHÂN BẢN.** Trước khi tạo file mới, kiểm tra index xem đã có file
   nào trùng chủ đề chưa → sửa file đó thay vì tạo bản trùng. Tri thức sai thì xóa file.
5. **KHÔNG GHI THỨ ĐÃ CÓ TRONG REPO.** Đừng ghi lại cấu trúc code hiển nhiên, lịch sử
   git, hay nội dung CLAUDE.md. Chỉ ghi cái **không suy ra được** từ việc đọc code:
   lý do (why), gotcha, quyết định, ràng buộc, bản đồ luồng phức tạp.
6. **KHÔNG SỬ DỤNG CÁC EMOJI TRONG GIAO DIỆN KHI CHƯA ĐƯỢC YÊU CẦU.** Tuyệt đối không sử dụng các emoji như "📖 📝 💬"
   trong giao diện frontend → kiểm tra trong codebase, nếu có hãy tìm các phương án thay thế khác 
## Khi nào ghi vào thư mục nào
- `map/` — bản đồ vùng code: cấu trúc module, luồng dữ liệu end-to-end, ranh giới
  service, dependency. Ghi khi bạn vừa phải mất công đọc nhiều file để hiểu một vùng.
- `features/` — tri thức theo module/feature: cách một feature hoạt động, các điểm
  mở rộng, hành vi đặc thù.
- `investigations/` — kết quả điều tra/debug/root-cause.
  Đặt tên: `YYYY-MM-DD-<slug>.md`. Ghi khi vừa tìm ra nguyên nhân một bug khó.
- `decisions/` — ADR rút gọn (quyết định kỹ thuật + lý do + phương án bị loại).
  Đặt tên: `NNNN-<slug>.md` (số tăng dần). Ghi khi chốt một lựa chọn kiến trúc/thư viện.
- `changes/` — nhật ký thay đổi đáng kể đã thực hiện.
  Đặt tên: `YYYY-MM-DD-<slug>.md`. Ghi sau khi hoàn thành một thay đổi lớn.

## Cấu trúc mỗi file memory
```markdown
---
title: <tiêu đề ngắn>
date: <YYYY-MM-DD>
tags: [<module>, <khái niệm>]
---

## Bối cảnh / Vấn đề
<1–3 câu: tại sao file này tồn tại>

## Nội dung
<tri thức cốt lõi: gotcha, luồng, quyết định, lý do. Dùng bullet, ngắn gọn.
Trỏ tới file/hàm cụ thể: `src/path/file.ts:42`. Liên kết file khác: [[slug]].>

## Liên quan
- [[slug-file-khac]] — vì sao liên quan
```

## Cập nhật index (BẮT BUỘC mỗi khi thêm/đổi tên file)
Mở `.ai/AGENT.md`, thêm/sửa **đúng 1 dòng** trong mục tương ứng, theo format:
`- [title](đường-dẫn) — hook ngắn gọn để biết khi nào cần đọc`
Hook phải đủ cụ thể để session sau quét index là biết file nào liên quan, không cần mở.

## Quy trình mỗi session (tóm tắt)
1. Đọc `.ai/AGENT.md` → chọn file liên quan → đọc → dùng lại.
2. Làm việc.
3. Có tri thức mới đáng giá? → ghi file đúng thư mục → cập nhật 1 dòng index.
4. Nếu phát hiện memory cũ sai/lỗi thời → sửa hoặc xóa, cập nhật index.