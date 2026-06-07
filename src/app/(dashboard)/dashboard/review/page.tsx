"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

type Goal = { id: string; title: string; level: string; status: string };

type ReviewAdjustments = {
  strengths: string[];
  challenges: string[];
  adjustments: string[];
  motivation: string;
};

type Review = {
  id: string;
  week_number: number;
  summary: string;
  adjustments: ReviewAdjustments;
  created_at: string;
};

function ReviewCard({ review, t }: { review: Review; t: ReturnType<typeof useLanguage>["t"] }) {
  const [expanded, setExpanded] = useState(false);
  const adj = review.adjustments;
  const r = t.review;

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <button onClick={() => setExpanded((e) => !e)} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.week} {review.week_number}</p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {new Date(review.created_at).toLocaleDateString("vi-VN", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <svg className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 dark:border-gray-800">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{review.summary}</p>

          {adj.strengths?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{r.strengths}</p>
              <ul className="space-y-1">
                {adj.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {adj.challenges?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">{r.challenges}</p>
              <ul className="space-y-1">
                {adj.challenges.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {adj.adjustments?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">{r.nextWeekFocus}</p>
              <ul className="space-y-1">
                {adj.adjustments.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="mt-1 shrink-0 text-blue-500">→</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {adj.motivation && (
            <p className="mt-4 rounded-md bg-gray-50 px-4 py-3 text-sm italic text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              &ldquo;{adj.motivation}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  const { t } = useLanguage();
  const r = t.review;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGoals() {
      const res = await fetch("/api/goals");
      if (res.ok) {
        const data = await res.json() as Goal[];
        const active = data.filter((g) => g.status !== "completed");
        setGoals(active);
        if (active.length > 0) setSelectedGoalId(active[0].id);
      }
      setLoadingGoals(false);
    }
    loadGoals();
  }, []);

  const loadReviews = useCallback(async (goalId: string) => {
    if (!goalId) return;
    setLoadingReviews(true);
    const res = await fetch(`/api/goals/${goalId}/reviews`);
    if (res.ok) setReviews(await res.json());
    setLoadingReviews(false);
  }, []);

  useEffect(() => {
    if (selectedGoalId) { setReviews([]); loadReviews(selectedGoalId); }
  }, [selectedGoalId, loadReviews]);

  async function handleGenerate() {
    if (!selectedGoalId) return;
    setError(null); setGenerating(true);
    const res = await fetch("/api/review/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: selectedGoalId }),
    });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) { setError(data.error ?? "Generation failed. Please try again."); return; }
    loadReviews(selectedGoalId);
  }

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  return (
    <div className="max-w-2xl">
      <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{r.title}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{r.subtitle}</p>
      </div>

      {loadingGoals ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white px-8 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.noGoals}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{r.noGoalsDesc}</p>
          <Link href="/dashboard/goals/new" className="mt-4 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">
            {r.createGoal}
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{r.selectGoal}</label>
              <select value={selectedGoalId} onChange={(e) => setSelectedGoalId(e.target.value)} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-gray-100">
                {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </div>
            <div className="mt-6">
              <button onClick={handleGenerate} disabled={generating || !selectedGoalId} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">
                {generating ? r.generating : r.generateWeek}
              </button>
            </div>
          </div>

          {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>}

          {generating && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {r.analyzing}{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedGoal?.title}</span>…
              </p>
            </div>
          )}

          {loadingReviews ? (
            <div className="flex justify-center py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.noReviews}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{r.noReviewsDesc}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                {reviews.length} {reviews.length !== 1 ? r.reviews : r.review} {r.clickExpand}
              </p>
              {reviews.map((rev) => <ReviewCard key={rev.id} review={rev} t={t} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
