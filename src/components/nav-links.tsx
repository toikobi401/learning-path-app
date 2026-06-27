"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";

export function NavLinks() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const LINKS = [
    { href: "/dashboard", label: t.nav.overview, exact: true },
    { href: "/dashboard/goals", label: t.nav.goals, exact: false },
    { href: "/dashboard/leaderboard", label: t.nav.leaderboard, exact: false },
    { href: "/dashboard/review", label: t.nav.review, exact: false },
    { href: "/dashboard/chat", label: t.nav.chat, exact: false },
    { href: "/dashboard/settings", label: t.nav.settings, exact: false },
  ];

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {LINKS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-accent/10 font-medium text-accent dark:bg-accent/15"
                : "text-gray-500 hover:bg-gray-100/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
