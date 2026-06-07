---
name: nextauth-v4
description: "NextAuth v4 specialist với JWT strategy, CredentialsProvider, Google OAuth, và PrismaAdapter. Use when làm việc với authentication, session, login/register, hoặc protected routes."
license: MIT
metadata:
  version: "1.0.0"
  domain: backend
  triggers: [NextAuth, authOptions, signIn, signOut, getServerSession, useSession, session, JWT, OAuth, Google, CredentialsProvider, withAuth, middleware]
  role: "NextAuth v4 Authentication Expert — JWT strategy, Prisma integration, App Router compatibility"
  scope: project-specific
  related-skills: [nextjs-app-router, prisma-mysql]
---

# NextAuth v4 Specialist

## Stack Context
- **next-auth:** 4.24.14
- **@auth/prisma-adapter:** 2.11.2
- **Session strategy:** JWT (bắt buộc với CredentialsProvider)
- **Providers:** CredentialsProvider (email/password) + GoogleProvider
- **Password hashing:** bcryptjs (cost factor 12)

## File Structure

```
src/
  lib/auth.ts                              # authOptions — import bởi mọi nơi
  app/api/auth/[...nextauth]/route.ts      # NextAuth handler
  app/api/auth/register/route.ts           # Custom registration endpoint
  middleware.ts                            # Route protection
  types/next-auth.d.ts                     # TypeScript augmentation
```

## Key Rules

1. **Import đúng cách cho App Router:**
   ```typescript
   import NextAuth from "next-auth/next";      // ✅ App Router
   import NextAuth from "next-auth";            // ❌ Pages Router only
   ```

2. **Session strategy phải là JWT khi dùng CredentialsProvider:**
   ```typescript
   session: { strategy: "jwt" }
   ```

3. **`redirect: false` khi signIn để handle lỗi inline:**
   ```typescript
   const result = await signIn("credentials", { email, password, redirect: false });
   if (result?.error) { setError("Invalid credentials"); return; }
   router.push("/dashboard");
   router.refresh(); // BẮT BUỘC — re-render Server Components
   ```

4. **Protected routes qua middleware** — không cần check session ở mỗi page

5. **Google OAuth callback URL** (phải add vào Google Cloud Console):
   `http://localhost:3000/api/auth/callback/google`

## TypeScript Fix (session.user.id)

```typescript
// src/types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}
```

## Routing Table

| Chủ đề | Xem ref |
|--------|---------|
| authOptions config đầy đủ, PrismaAdapter, callbacks | [refs/config.md](refs/config.md) |
| Middleware, patterns, troubleshooting | [refs/patterns.md](refs/patterns.md) |
