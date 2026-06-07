# NextAuth v4 — authOptions Config

## Full authOptions (src/lib/auth.ts)

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },  // BẮT BUỘC với CredentialsProvider
  pages: { signIn: "/login" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) return null;  // null = OAuth user không có password

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;  // Embed id vào token lần đầu sign-in
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
  },
};
```

## NextAuth App Router Handler

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth/next";  // /next — QUAN TRỌNG
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

## TypeScript Augmentation

```typescript
// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
  }
}
```

## Registration Endpoint

```typescript
// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "Password min 8 characters" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, provider: "email" },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(user, { status: 201 });
}
```

## getServerSession trong Server Components

```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
if (!session) redirect("/login");

const userId = session.user.id;  // TypeScript OK vì có augmentation
```
