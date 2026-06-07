"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          If an account with{" "}
          <span className="font-medium text-gray-900 dark:text-gray-200">{email}</span> exists,
          we&apos;ve sent a reset code. It expires in 15 minutes.
        </p>
        <button
          onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
          className="mt-8 w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
        >
          Enter reset code
        </button>
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/login" className="font-medium text-gray-900 underline underline-offset-4 dark:text-gray-100">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        Forgot password
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Enter your account email and we&apos;ll send you a reset code.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-600 dark:focus:border-gray-600 dark:focus:ring-gray-800"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
        >
          {loading ? "Sending..." : "Send reset code"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link href="/login" className="font-medium text-gray-900 underline underline-offset-4 dark:text-gray-100">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
