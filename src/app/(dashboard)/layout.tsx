import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatarHeader } from "@/components/user-avatar-header";
import { NavLinks } from "@/components/nav-links";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, avatar_url: true },
  });

  const displayName = user?.name ?? session.user?.name ?? session.user?.email ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100"
            >
              PathAI
            </Link>
            <NavLinks />
          </div>

          <div className="flex items-center gap-3">
            <UserAvatarHeader
              initialName={displayName}
              initialAvatarUrl={user?.avatar_url ?? null}
            />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
