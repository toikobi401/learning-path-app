import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatarHeader } from "@/components/user-avatar-header";
import { NavLinks } from "@/components/nav-links";
import { Logo } from "@/components/logo";
import { prisma } from "@/lib/prisma";
import { LanguageProvider } from "@/lib/i18n/context";
import type { Language } from "@/lib/i18n/translations";
import ChatWidget from "@/components/chat-widget";
import PomodoroWidget from "@/components/pomodoro-widget";
import { SiteBackground } from "@/components/motion/site-background";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, avatar_url: true },
    }),
    prisma.userSettings.findUnique({
      where: { user_id: session.user.id },
      select: { ui_language: true, show_chat_widget: true },
    }),
  ]);

  const displayName = user?.name ?? session.user?.name ?? session.user?.email ?? "";
  const initialEmail = session.user?.email ?? "";
  const initialLang = (settings?.ui_language ?? "vi") as Language;
  const showChatWidget = settings?.show_chat_widget ?? true;

  return (
    <LanguageProvider initialLang={initialLang}>
      <div className="relative isolate flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
        <SiteBackground variant="subtle" />
        <header className="glass sticky top-0 z-40 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
            <div className="flex items-center gap-8">
              <Link
                href="/dashboard"
                className="flex items-center transition-transform duration-300 hover:scale-105"
              >
                <Logo variant="full" priority className="h-7" />
              </Link>
              <NavLinks />
            </div>

            <div className="flex items-center gap-3">
              <UserAvatarHeader
                initialName={displayName}
                initialEmail={initialEmail}
                initialAvatarUrl={user?.avatar_url ?? null}
              />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-8 py-10">
            {children}
          </div>
        </main>

        {showChatWidget && <ChatWidget />}
        <PomodoroWidget />
      </div>
    </LanguageProvider>
  );
}
