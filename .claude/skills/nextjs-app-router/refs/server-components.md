# Server Components vs Client Components

## Decision Tree

```
Cần useState / useEffect / event handlers?  →  "use client"
Cần browser APIs (window, document)?        →  "use client"
Cần useSession() / signIn() / signOut()?   →  "use client"
Còn lại (data fetching, DB, session)?       →  Server Component (default)
```

## Server Component — Data Fetching

```typescript
// src/app/(dashboard)/dashboard/page.tsx — NO "use client"
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const goals = await prisma.goal.findMany({
    where: { user_id: session.user.id, status: "active" },
    orderBy: { created_at: "desc" },
  });

  return <div>{goals.map(g => <GoalCard key={g.id} goal={g} />)}</div>;
}
```

## Client Component — Interactive

```typescript
"use client";
import { useState } from "react";

export function GoalForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/goals", { method: "POST", body: ... });
    // ...
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Composing — Server wraps Client

```typescript
// Layout.tsx (Server Component)
import { SignOutButton } from "@/components/sign-out-button";  // Client
import { getServerSession } from "next-auth/next";

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  return (
    <div>
      <header>
        <span>{session?.user?.name}</span>
        <SignOutButton />  {/* Client Component trong Server layout */}
      </header>
      {children}
    </div>
  );
}
```

## Metadata (Server Components only)

```typescript
// page.tsx hoặc layout.tsx
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Learning Path App",
  description: "AI-powered personalized learning",
};
```

## Tailwind v4 — CSS Setup

```css
/* src/app/globals.css */
@import "tailwindcss";   /* v4 — KHÔNG dùng @tailwind base/components/utilities */
```

Class names vẫn dùng bình thường: `className="flex items-center gap-4"`.
