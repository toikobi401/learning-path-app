import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
            Learning Path
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {session.user?.name ?? session.user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
