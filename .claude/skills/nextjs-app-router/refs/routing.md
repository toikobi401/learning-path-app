# Next.js App Router — Routing Reference

## Route Groups

Dùng `(folder)` để nhóm routes mà không ảnh hưởng URL:

```
src/app/
  (auth)/login/page.tsx      → URL: /login
  (auth)/register/page.tsx   → URL: /register
  (dashboard)/dashboard/page.tsx → URL: /dashboard
```

Mỗi route group có layout riêng. Layout của `(auth)` không apply cho `(dashboard)` và ngược lại.

## Dynamic Routes

```
src/app/(dashboard)/path/[goalId]/page.tsx  → /path/abc123
src/app/api/auth/[...nextauth]/route.ts      → /api/auth/* (catch-all)
```

Lấy params trong Server Component:
```typescript
export default async function Page({ params }: { params: { goalId: string } }) {
  const { goalId } = params;
}
```

## API Routes (App Router)

```typescript
// src/app/api/goals/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({ where: { user_id: session.user.id } });
  return NextResponse.json(goals);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const goal = await prisma.goal.create({ data: { ...body, user_id: session.user.id } });
  return NextResponse.json(goal, { status: 201 });
}
```

## Middleware (Proxy)

> **Next.js 16 Breaking Change:** `middleware.ts` đã đổi tên thành `proxy.ts`

```typescript
// src/proxy.ts  ← ĐÚNG cho Next.js 16 (không phải middleware.ts)
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: { authorized: ({ token }) => !!token },
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/dashboard/:path*"],  // Chỉ protect dashboard routes
};
```

**Quan trọng:** Không đưa `/login` hay `/register` vào matcher — chúng phải public.

## Navigation

```typescript
// Client Component
import { useRouter } from "next/navigation";
const router = useRouter();
router.push("/dashboard");
router.refresh();  // Re-render Server Components với data mới

// Server Component redirect
import { redirect } from "next/navigation";
redirect("/login");
```

## Next.js 16 — Image và Link

```typescript
import Link from "next/link";
import Image from "next/image";

<Link href="/dashboard">Dashboard</Link>
<Image src="/logo.png" alt="Logo" width={100} height={100} />
```
