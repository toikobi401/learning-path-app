"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/goals", label: "Goals", exact: false },
  { href: "/dashboard/review", label: "Review", exact: false },
  { href: "/dashboard/chat", label: "Chat", exact: false },
];

export function NavLinks() {
  const pathname = usePathname();

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
                ? "bg-gray-100 font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
