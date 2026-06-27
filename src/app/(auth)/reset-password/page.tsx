"use client";

import { Suspense } from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function handleOtpChange(index: number, value: string) {
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
    if (code.length < 6) { setError("Please enter the 6-digit code."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: code, password }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Reset failed. Please try again.");
      return;
    }

    router.push("/login?reset=1");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        Reset <span className="text-gradient">password</span>
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Enter the code sent to{" "}
        <span className="font-medium text-gray-900 dark:text-gray-200">{email}</span>{" "}
        and choose a new password.
      </p>

      {error && (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reset code
          </label>
          <div className="flex gap-2.5" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-full rounded-lg border border-gray-200 bg-white/70 text-center text-lg font-semibold text-gray-900 outline-none transition-all duration-200 focus:border-accent focus:ring-4 focus:ring-accent/15 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:focus:border-accent"
              />
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field mt-1.5"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Resetting..." : "Set new password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Didn&apos;t get the code?{" "}
        <Link href="/forgot-password" className="font-medium text-gray-900 underline underline-offset-4 dark:text-gray-100">
          Try again
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
