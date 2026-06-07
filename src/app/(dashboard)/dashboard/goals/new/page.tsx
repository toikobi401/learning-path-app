"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

type FormState = {
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  hours_per_day: string;
  deadline: string;
};

function tomorrowString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

const inputCls =
  "mt-1.5 block w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-600 dark:focus:ring-gray-800";

export default function NewGoalPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const ng = t.newGoal;

  const [form, setForm] = useState<FormState>({
    title: "", description: "", level: "beginner", hours_per_day: "1", deadline: tomorrowString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, hours_per_day: parseFloat(form.hours_per_day) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    router.push("/dashboard/goals");
  }

  const LEVELS: Array<{ value: "beginner" | "intermediate" | "advanced"; label: string }> = [
    { value: "beginner", label: t.goals.level.beginner },
    { value: "intermediate", label: t.goals.level.intermediate },
    { value: "advanced", label: t.goals.level.advanced },
  ];

  return (
    <div className="max-w-xl">
      <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Link href="/dashboard/goals" className="hover:text-gray-700 dark:hover:text-gray-300">
            {t.nav.goals}
          </Link>
          <span>/</span>
          <span className="text-gray-600 dark:text-gray-300">{ng.breadcrumb}</span>
        </div>
        <h1 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">{ng.title}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{ng.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{ng.titleLabel}</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder={ng.titlePlaceholder} required minLength={3} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{ng.descLabel}</label>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{ng.descHint}</p>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={ng.descPlaceholder} required minLength={10} rows={4} className={inputCls + " resize-none"} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{ng.levelLabel}</label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {LEVELS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => set("level", value)}
                className={`rounded-md border px-3 py-2.5 text-sm font-medium transition ${form.level === value ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{ng.hoursLabel}</label>
            <input type="number" value={form.hours_per_day} onChange={(e) => set("hours_per_day", e.target.value)} min={0.5} max={12} step={0.5} required className={inputCls} />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{ng.hoursHint}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{ng.deadlineLabel}</label>
            <input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} min={tomorrowString()} required className={inputCls} />
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/dashboard/goals" className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
            {ng.cancel}
          </Link>
          <button type="submit" disabled={loading} className="rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">
            {loading ? ng.creating : ng.create}
          </button>
        </div>
      </form>
    </div>
  );
}
