"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type TopicStatus = "not_started" | "in_progress" | "completed";

type Topic = {
  id: string;
  title: string;
  description: string;
  estimated_hrs: number;
  week_number: number;
  order_index: number;
};

type Phase = {
  id: string;
  title: string;
  order_index: number;
  topics: Topic[];
};

type LearningPath = {
  id: string;
  total_weeks: number;
  status: string;
  generated_at: string;
  raw_json: { overview?: string };
  phases: Phase[];
};

type Goal = {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  hours_per_day: number;
  deadline: string;
  status: string;
};

type ProgressMap = Record<string, TopicStatus>;

const LEVEL_COLOR: Record<string, string> = {
  beginner:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  intermediate:
    "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  advanced:
    "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-800",
};

const PHASE_BORDER = [
  "border-l-blue-400 dark:border-l-blue-700",
  "border-l-purple-400 dark:border-l-purple-700",
  "border-l-orange-400 dark:border-l-orange-700",
  "border-l-green-400 dark:border-l-green-700",
];

const PHASE_BAR = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-green-500",
];

function CheckCircle({ status, loading }: { status: TopicStatus; loading: boolean }) {
  if (loading) {
    return (
      <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin dark:border-gray-600" />
    );
  }
  if (status === "completed") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 transition-all">
        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6.5L4.5 8.5L9.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  if (status === "in_progress") {
    return (
      <div className="h-5 w-5 rounded-full border-2 border-blue-400 dark:border-blue-600">
        <div className="m-0.5 h-2.5 w-2.5 rounded-full bg-blue-400 dark:bg-blue-600" />
      </div>
    );
  }
  return (
    <div className="h-5 w-5 rounded-full border-2 border-gray-300 transition-colors group-hover:border-green-400 dark:border-gray-600 dark:group-hover:border-green-500" />
  );
}

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [pathRes, progressRes] = await Promise.all([
      fetch(`/api/goals/${id}/path`),
      fetch(`/api/goals/${id}/progress`),
    ]);

    if (pathRes.ok) {
      const data = await pathRes.json();
      setGoal(data.goal);
      setPath(data.path);
    }
    if (progressRes.ok) {
      const data = await progressRes.json() as Record<string, { status: TopicStatus }>;
      const map: ProgressMap = {};
      for (const [topicId, log] of Object.entries(data)) {
        map[topicId] = log.status;
      }
      setProgress(map);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleGenerate() {
    setGenerateError(null);
    setGenerating(true);

    const res = await fetch(`/api/goals/${id}/generate`, { method: "POST" });
    const data = await res.json();
    setGenerating(false);

    if (!res.ok) {
      setGenerateError(data.error ?? "Generation failed.");
      return;
    }

    setPath(data.path);
    setProgress({});
  }

  async function toggleTopic(topicId: string) {
    const current = progress[topicId] ?? "not_started";
    const next: TopicStatus =
      current === "completed" ? "not_started" : "completed";

    // Optimistic update
    setProgress((p) => ({ ...p, [topicId]: next }));
    setToggling(topicId);

    const res = await fetch(`/api/topics/${topicId}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    setToggling(null);

    if (!res.ok) {
      // Revert on failure
      setProgress((p) => ({ ...p, [topicId]: current }));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        Goal not found.{" "}
        <Link href="/dashboard/goals" className="underline">
          Back to goals
        </Link>
      </div>
    );
  }

  const deadline = new Date(goal.deadline).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const allTopics = path?.phases.flatMap((p) => p.topics) ?? [];
  const totalTopics = allTopics.length;
  const totalCompleted = allTopics.filter(
    (t) => (progress[t.id] ?? "not_started") === "completed"
  ).length;
  const progressPct =
    totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;
  const totalHours = allTopics.reduce((sum, t) => sum + t.estimated_hrs, 0);

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link
          href="/dashboard/goals"
          className="hover:text-gray-700 dark:hover:text-gray-300"
        >
          Goals
        </Link>
        <span>/</span>
        <span className="truncate text-gray-600 dark:text-gray-300">
          {goal.title}
        </span>
      </div>

      {/* Goal header card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${LEVEL_COLOR[goal.level]}`}
              >
                {goal.level}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {goal.hours_per_day}h/day &middot; Due {deadline}
              </span>
            </div>
            <h1 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {goal.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {goal.description}
            </p>
          </div>

          {path && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="shrink-0 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {generating ? "Regenerating…" : "Regenerate"}
            </button>
          )}
        </div>

        {/* Stats row */}
        {path && (
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
            <div className="flex flex-wrap gap-5">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Duration</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {path.total_weeks} weeks
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Phases</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {path.phases.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Topics</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {totalCompleted}/{totalTopics}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Est. hours</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {Math.round(totalHours)}h
                </p>
              </div>
            </div>

            {/* Overall progress bar */}
            {totalTopics > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>Overall progress</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generate error */}
      {generateError && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {generateError}
        </p>
      )}

      {/* Generating spinner */}
      {generating && (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Generating your personalized path…
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              This usually takes 15–30 seconds.
            </p>
          </div>
        </div>
      )}

      {/* No path yet */}
      {!path && !generating && (
        <div className="mt-4 flex flex-col items-center gap-5 rounded-lg border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              No learning path yet
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-400">
              PathAI will analyze your goal and create a structured,
              week-by-week curriculum tailored to your level and schedule.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
          >
            Generate learning path
          </button>
        </div>
      )}

      {/* Learning path */}
      {path && !generating && (
        <div className="mt-4 space-y-4">
          {/* Overview */}
          {path.raw_json?.overview && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Overview
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {path.raw_json.overview}
              </p>
            </div>
          )}

          {/* Phases */}
          {path.phases.map((phase, phaseIdx) => {
            const phaseCompleted = phase.topics.filter(
              (t) => (progress[t.id] ?? "not_started") === "completed"
            ).length;
            const phaseTotal = phase.topics.length;
            const phasePct =
              phaseTotal > 0
                ? Math.round((phaseCompleted / phaseTotal) * 100)
                : 0;

            return (
              <div
                key={phase.id}
                className={`overflow-hidden rounded-lg border border-l-4 border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${PHASE_BORDER[phaseIdx % PHASE_BORDER.length]}`}
              >
                {/* Phase header */}
                <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Phase {phase.order_index + 1}: {phase.title}
                    </h2>
                    <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                      {phaseCompleted}/{phaseTotal}
                    </span>
                  </div>
                  {/* Phase progress bar */}
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-1 rounded-full transition-all duration-500 ${PHASE_BAR[phaseIdx % PHASE_BAR.length]}`}
                      style={{ width: `${phasePct}%` }}
                    />
                  </div>
                </div>

                {/* Topics */}
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {phase.topics.map((topic) => {
                    const status: TopicStatus =
                      progress[topic.id] ?? "not_started";
                    const isCompleted = status === "completed";
                    const isToggling = toggling === topic.id;

                    return (
                      <div
                        key={topic.id}
                        className={`px-5 py-4 transition-colors ${isCompleted ? "bg-gray-50/50 dark:bg-gray-800/30" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Toggle button */}
                          <button
                            onClick={() => toggleTopic(topic.id)}
                            disabled={isToggling}
                            className="group mt-0.5 shrink-0 cursor-pointer disabled:cursor-default"
                            title={
                              isCompleted ? "Mark as incomplete" : "Mark as complete"
                            }
                          >
                            <CheckCircle
                              status={status}
                              loading={isToggling}
                            />
                          </button>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                                Week {topic.week_number}
                              </span>
                              <h3
                                className={`text-sm font-medium transition-colors ${
                                  isCompleted
                                    ? "text-gray-400 line-through dark:text-gray-500"
                                    : "text-gray-900 dark:text-gray-100"
                                }`}
                              >
                                {topic.title}
                              </h3>
                            </div>
                            <p
                              className={`mt-1.5 text-xs leading-relaxed transition-colors ${
                                isCompleted
                                  ? "text-gray-400 dark:text-gray-600"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {topic.description}
                            </p>
                          </div>

                          {/* Hours */}
                          <span className="shrink-0 whitespace-nowrap text-xs font-medium text-gray-400 dark:text-gray-500">
                            {topic.estimated_hrs}h
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
