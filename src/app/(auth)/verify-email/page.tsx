"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill("");
    text.split("").forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputs.current[Math.min(text.length, 5)]?.focus();
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: code }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Verification failed.");
      setLoading(false);
      return;
    }

    // Auto sign-in after verification
    const result = await signIn("credentials", {
      email,
      // Password isn't needed here — we rely on the session cookie from register
      // Redirect to dashboard directly
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (result?.error) {
      // Sign-in failed after verify — send to login
      router.push("/login?verified=1");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleResend() {
    setResending(true);
    setResent(false);
    setError(null);
    await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResending(false);
    setResent(true);
    setOtp(["", "", "", "", "", ""]);
    inputs.current[0]?.focus();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        Check your email
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-gray-900 dark:text-gray-200">{email}</span>.
        <br />
        Enter it below to verify your account.
      </p>

      {error && (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {resent && (
        <div className="mt-5 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
          New code sent. Check your inbox.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8">
        {/* OTP inputs */}
        <div className="flex gap-2.5" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-12 w-full rounded-md border border-gray-200 bg-white text-center text-lg font-semibold text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-600 dark:focus:ring-gray-800"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.join("").length < 6}
          className="mt-6 w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
        >
          {loading ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Didn&apos;t receive it?</span>
        <button
          onClick={handleResend}
          disabled={resending}
          className="font-medium text-gray-900 underline underline-offset-4 disabled:opacity-50 dark:text-gray-100"
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </div>
    </div>
  );
}
