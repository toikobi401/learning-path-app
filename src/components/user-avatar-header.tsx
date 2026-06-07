"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUserStore } from "@/lib/stores/user-store";

type Props = {
  initialName: string;
  initialAvatarUrl: string | null;
};

export function UserAvatarHeader({ initialName, initialAvatarUrl }: Props) {
  const { name, avatarUrl, setUser } = useUserStore();

  // Seed the store once with server-fetched data
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
    <Link href="/dashboard/profile" className="flex items-center gap-2.5" title="Profile">
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200 dark:ring-gray-700">
        {src ? (
          <Image src={src} alt={displayName} fill className="object-cover" unoptimized />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gray-900 text-xs font-semibold text-white dark:bg-gray-100 dark:text-gray-900">
            {initials}
          </span>
        )}
      </div>
      <span className="hidden text-sm text-gray-500 transition-colors hover:text-gray-900 sm:block dark:text-gray-400 dark:hover:text-gray-100">
        {displayName}
      </span>
    </Link>
  );
}
