# Learning Path App — Project Context

## Project Overview
Personalized Learning Path Generator — web app giúp người dùng tạo lộ trình học tập cá nhân hóa bằng AI.

## Tech Stack
- **Frontend/Backend:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** MySQL 8 via Prisma ORM
- **Auth:** NextAuth.js (Email + Google OAuth)
- **LLM:** Claude API (Anthropic) — `claude-sonnet-4-6`
- **State:** Zustand (client) + TanStack Query (server state)
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
    claude.ts       # Claude API wrapper
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
DATABASE_URL        # MySQL connection string
NEXTAUTH_URL        # http://localhost:3000
NEXTAUTH_SECRET     # random secret
GOOGLE_CLIENT_ID    # Google OAuth
GOOGLE_CLIENT_SECRET
ANTHROPIC_API_KEY   # Claude API
```

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

## LLM Usage
- Model: `claude-sonnet-4-6`
- Learning path generation: structured JSON output
- Chat: streaming response
- Weekly review: summary + adjustments JSON
- All prompts in: `src/lib/prompts/`
