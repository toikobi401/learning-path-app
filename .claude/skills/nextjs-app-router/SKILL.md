---
name: nextjs-app-router
description: "Next.js 16 App Router specialist với React 19, Tailwind v4, TypeScript. Use when làm việc với routing, layouts, Server Components, API routes, hoặc bất kỳ file nào trong src/app/."
license: MIT
metadata:
  version: "1.0.0"
  domain: frontend
  triggers: [App Router, RSC, route.ts, Server Component, "use client", layout, page, middleware, next/navigation, next/server]
  role: "Next.js 16 App Router Expert — chuyên gia về file-based routing, React Server Components, và streaming trong dự án này"
  scope: project-specific
  related-skills: [nextauth-v4, prisma-mysql]
---

# Next.js App Router Specialist

## Stack Context
- **Next.js:** 16.2.7 (App Router, không dùng Pages Router)
- **React:** 19.2.4 (Server Components mặc định)
- **Tailwind:** v4 (`@import "tailwindcss"` — không dùng `@tailwind` directives)
- **TypeScript:** strict mode, alias `@/*` → `./src/*`

## Route Structure của dự án

```
src/app/
  (auth)/           # Route group — URL không có "(auth)"
    layout.tsx      # Centered layout cho login/register
    login/page.tsx
    register/page.tsx
  (dashboard)/      # Route group — URL không có "(dashboard)"
    layout.tsx      # Header + nav, đọc session server-side
    dashboard/page.tsx
  api/
    auth/
      [...nextauth]/route.ts   # NextAuth catch-all handler
      register/route.ts        # Custom POST endpoint
  layout.tsx        # Root layout — wrap với <Providers>
  page.tsx          # Landing page
```

## Golden Rules

1. **Server Component by default** — chỉ thêm `"use client"` khi cần browser APIs, event handlers, hoặc hooks
2. **Prisma chỉ trong server** — API routes hoặc Server Components, KHÔNG BAO GIỜ trong Client Components
3. **`router.refresh()` sau auth change** — bắt buộc sau `router.push()` khi session thay đổi
4. **Import NextAuth đúng cách** — dùng `next-auth/next` (không phải `next-auth`) cho App Router handler
5. **Tailwind v4** — dùng `@import "tailwindcss"` trong CSS, class names vẫn như cũ

## Routing Table

| Chủ đề | Xem ref |
|--------|---------|
| Route groups, dynamic routes, middleware | [refs/routing.md](refs/routing.md) |
| Server vs Client Components, data fetching | [refs/server-components.md](refs/server-components.md) |
