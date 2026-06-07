"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useUserStore } from "@/lib/stores/user-store";

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  provider: string;
  created_at: string;
};

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const setUser = useUserStore((s) => s.setUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setProfile(data);
        setName(data.name ?? "");
      });
  }, []);

  async function handleNameSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(false);
    setNameLoading(true);

    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setNameLoading(false);

    if (!res.ok) {
      setNameError(data.error ?? "Update failed.");
      return;
    }

    setProfile((p) => p ? { ...p, name: data.name } : p);
    setUser({ name: data.name });
    await updateSession({ name: data.name });
    setNameSuccess(true);
    setTimeout(() => setNameSuccess(false), 3000);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarLoading(true);

    const form = new FormData();
    form.append("avatar", file);

    const res = await fetch("/api/user", { method: "PATCH", body: form });
    const data = await res.json();
    setAvatarLoading(false);

    if (!res.ok) {
      setAvatarError(data.error ?? "Upload failed.");
      setAvatarPreview(null);
      return;
    }

    setProfile((p) => p ? { ...p, avatar_url: data.avatar_url } : p);
    setUser({ avatarUrl: data.avatar_url });
    setAvatarPreview(null);
  }

  const avatarSrc = avatarPreview ?? profile?.avatar_url ?? null;
  const initials = (profile?.name ?? profile?.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="max-w-2xl">
      <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Profile</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your personal information.
        </p>
      </div>

      {/* Avatar */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Avatar</h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          JPEG, PNG or WebP. Max 5 MB.
        </p>

        <div className="mt-5 flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt="Avatar"
                fill
                className="rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-900 text-xl font-bold text-white dark:bg-gray-100 dark:text-gray-900">
                {initials}
              </div>
            )}
            {avatarLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarLoading}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {avatarLoading ? "Uploading..." : "Change avatar"}
            </button>
            {avatarError && (
              <p className="text-xs text-red-600 dark:text-red-400">{avatarError}</p>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </section>

      {/* Name */}
      <section className="mt-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Display name</h2>

        <form onSubmit={handleNameSubmit} className="mt-5 flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="name" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Full name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="mt-1.5 block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-600 dark:focus:ring-gray-800"
            />
          </div>
          <button
            type="submit"
            disabled={nameLoading}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
          >
            {nameLoading ? "Saving..." : "Save"}
          </button>
        </form>

        {nameError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{nameError}</p>
        )}
        {nameSuccess && (
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">Name updated.</p>
        )}
      </section>

      {/* Account info (read-only) */}
      <section className="mt-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Account</h2>

        <dl className="mt-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
            <dt className="text-sm text-gray-500 dark:text-gray-400">Email</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {profile?.email ?? "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
            <dt className="text-sm text-gray-500 dark:text-gray-400">Sign-in method</dt>
            <dd className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
              {profile?.provider ?? "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-500 dark:text-gray-400">Member since</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{joinedDate}</dd>
          </div>
        </dl>
      </section>

      {/* Danger zone */}
      <section className="mt-4 rounded-lg border border-red-100 bg-white p-6 dark:border-red-950 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Once you delete your account, all data will be permanently removed.
        </p>
        <button
          disabled
          className="mt-4 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          title="Coming soon"
        >
          Delete account
        </button>
      </section>
    </div>
  );
}
