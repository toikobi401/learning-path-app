# NextAuth v4 — Patterns & Troubleshooting

## Client-side Auth Patterns

### Login với error handling inline

```typescript
"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const result = await signIn("credentials", {
  email,
  password,
  redirect: false,  // KHÔNG redirect tự động để catch lỗi
});

if (result?.error) {
  setError("Invalid email or password");  // Hiển thị lỗi, KHÔNG redirect
  return;
}

router.push("/dashboard");
router.refresh();  // BẮT BUỘC — re-render Server Components với session mới
```

### Google OAuth

```typescript
await signIn("google", { callbackUrl: "/dashboard" });
// NextAuth tự xử lý redirect và callback
```

### Auto sign-in sau register

```typescript
// Register trước
const res = await fetch("/api/auth/register", { method: "POST", body: JSON.stringify({...}) });
if (!res.ok) { setError((await res.json()).error); return; }

// Rồi sign in luôn
const result = await signIn("credentials", { email, password, redirect: false });
if (!result?.error) { router.push("/dashboard"); router.refresh(); }
```

### Sign out

```typescript
"use client";
import { signOut } from "next-auth/react";
<button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
```

### useSession trong Client Component

```typescript
"use client";
import { useSession } from "next-auth/react";

export function UserAvatar() {
  const { data: session, status } = useSession();
  if (status === "loading") return <Spinner />;
  if (!session) return null;
  return <span>{session.user.name}</span>;
}
```

## Middleware — Route Protection

```typescript
// src/middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: { authorized: ({ token }) => !!token },
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/dashboard/:path*"],
  // Thêm routes mới ở đây khi cần protect
};
```

## Troubleshooting

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| `NEXTAUTH_SECRET` warning | Chưa set secret | Add `NEXTAUTH_SECRET` vào `.env` |
| `redirect_uri_mismatch` (Google) | Chưa thêm callback URL | Add `http://localhost:3000/api/auth/callback/google` vào Google Console |
| `session.user.id` TypeScript error | Thiếu type augmentation | Tạo `src/types/next-auth.d.ts` |
| Server Component không thấy session sau login | Thiếu `router.refresh()` | Thêm `router.refresh()` sau `router.push()` |
| CredentialsProvider không dùng được database session | Giới hạn của NextAuth | Giữ `strategy: "jwt"` — đây là behavior đúng |

## Environment Variables cần thiết

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="random-32-char-string"
GOOGLE_CLIENT_ID="xxx.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
```
