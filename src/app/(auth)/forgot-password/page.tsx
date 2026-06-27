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
          Check your <span className="text-gradient">email</span>
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          If an account with{" "}
          <span className="font-medium text-gray-900 dark:text-gray-200">{email}</span> exists,
          we&apos;ve sent a reset code. It expires in 15 minutes.
        </p>
        <button
          onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
          className="btn-primary mt-8 w-full"
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
        Forgot <span className="text-gradient">password</span>
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
            className="field mt-1.5"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
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
