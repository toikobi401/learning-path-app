"use client";

import { Suspense } from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justReset = params.get("reset") === "1";
  const justVerified = params.get("verified") === "1";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        Welcome <span className="text-gradient">back</span>
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Sign in to continue to your learning path.
      </p>

      {justReset && (
        <div className="mt-5 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
          Password updated. Sign in with your new password.
        </div>
      )}
      {justVerified && (
        <div className="mt-5 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
          Email verified. You can now sign in.
        </div>
      )}
      {error && (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white/70 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-accent focus:ring-4 focus:ring-accent/15 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder-gray-600 dark:focus:border-accent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-gray-500 underline underline-offset-4 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white/70 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-accent focus:ring-4 focus:ring-accent/15 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder-gray-600 dark:focus:border-accent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-lg bg-linear-to-r from-accent to-accent-2 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all duration-300 hover:shadow-accent/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative">{loading ? "Signing in..." : "Sign in"}</span>
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
        <span className="text-xs text-gray-400 dark:text-gray-600">or</span>
        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
        </svg>
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-gray-900 underline underline-offset-4 dark:text-gray-100">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
