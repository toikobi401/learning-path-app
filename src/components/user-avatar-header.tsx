"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useUserStore } from "@/lib/stores/user-store";
import { useLanguage } from "@/lib/i18n/context";

type Props = {
  initialName: string;
  initialEmail: string;
  initialAvatarUrl: string | null;
};

export function UserAvatarHeader({ initialName, initialEmail, initialAvatarUrl }: Props) {
  const { name, avatarUrl, setUser } = useUserStore();
  const { t } = useLanguage();

  useEffect(() => {
    setUser({ name: initialName, avatarUrl: initialAvatarUrl });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = name ?? initialName;
  const src = avatarUrl ?? initialAvatarUrl;

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative group">
      {/* Trigger */}
      <button className="flex items-center gap-2.5 rounded-md px-1 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200 dark:ring-gray-700">
          {src ? (
            <Image src={src} alt={displayName} fill className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gray-900 text-xs font-semibold text-white dark:bg-gray-100 dark:text-gray-900">
              {initials}
            </span>
          )}
        </div>
        <span className="hidden text-sm text-gray-600 sm:block dark:text-gray-300">
          {displayName}
        </span>
        {/* Chevron */}
        <svg
          className="hidden h-3.5 w-3.5 text-gray-400 sm:block"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown — the pt-2 bridge prevents the gap from closing the menu */}
      <div className="absolute right-0 top-full z-50 hidden w-56 group-hover:block">
        <div className="pt-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {/* User info header */}
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {displayName}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{initialEmail}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {t.common.profile}
              </Link>

              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t.nav.settings}
              </Link>
            </div>

            {/* Sign out */}
            <div className="border-t border-gray-100 py-1 dark:border-gray-800">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                {t.common.signOut}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
