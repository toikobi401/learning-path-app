"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import Markdown from "@/components/markdown";
import TopicQuiz from "@/components/topic-quiz";

type ResourceType = "article" | "video" | "course" | "doc";
type Resource = { id: string; title: string; url: string; type: ResourceType; source: string };
type Status = "not_started" | "in_progress" | "completed";
type Sibling = { id: string; title: string } | null;

type Props = {
  goalId: string;
  goalTitle: string;
  phaseTitle: string;
  topic: { id: string; title: string; description: string; week_number: number; estimated_hrs: number };
  initialLesson: string | null;
  initialStatus: Status;
  initialNote: string;
  initialResources: Resource[];
  prev: Sibling;
  next: Sibling;
};

const TYPE_LABEL: Record<ResourceType, string> = {
  article: "Article",
  video: "Video",
  course: "Course",
  doc: "Doc",
};

export default function TopicLearnView({
  goalId,
  goalTitle,
  phaseTitle,
  topic,
  initialLesson,
  initialStatus,
  initialNote,
  initialResources,
  prev,
  next,
}: Props) {
  const { t } = useLanguage();
  const gd = t.goalDetail;
  const tl = t.topicLearn;
  const tq = t.topicQuiz;
  const [showQuizAnyway, setShowQuizAnyway] = useState(false);

  // ── Lesson ──
  const [lesson, setLesson] = useState<string | null>(initialLesson);
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);

  async function generateLesson() {
    setLessonError(null);
    setGeneratingLesson(true);
    const res = await fetch(`/api/topics/${topic.id}/lesson`, { method: "POST" });
    const data = await res.json();
    setGeneratingLesson(false);
    if (!res.ok) { setLessonError(data.error ?? gd.lessonError); return; }
    setLesson(data.content);
  }

  // ── Progress (status) ──
  const [status, setStatus] = useState<Status>(initialStatus);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const isCompleted = status === "completed";

  async function toggleStatus() {
    setTogglingStatus(true);
    const next: Status = isCompleted ? "not_started" : "completed";
    const res = await fetch(`/api/topics/${topic.id}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setTogglingStatus(false);
    if (res.ok) setStatus(next);
  }

  // ── Notes (autosave) ──
  const [note, setNote] = useState(initialNote);
  const [noteStatus, setNoteStatus] = useState<"idle" | "saving" | "saved">("idle");
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function changeNote(v: string) {
    setNote(v);
    setNoteStatus("saving");
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/topics/${topic.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: v }),
      });
      if (res.ok) {
        setNoteStatus("saved");
        setTimeout(() => setNoteStatus("idle"), 1500);
      } else setNoteStatus("idle");
    }, 700);
  }

  // ── Resources ──
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [loadingResources, setLoadingResources] = useState(false);

  const generateResources = useCallback(async () => {
    setLoadingResources(true);
    const res = await fetch(`/api/topics/${topic.id}/resources`, { method: "POST" });
    if (res.ok) setResources(await res.json());
    setLoadingResources(false);
  }, [topic.id]);

  const askHref = `/dashboard/chat?goalId=${goalId}&q=${encodeURIComponent(`${gd.askAiPrompt}: ${topic.title}`)}`;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Breadcrumb + back */}
      <div className="mb-6">
        <Link
          href={`/dashboard/goals/${goalId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          ← {tl.back}
        </Link>
        <p className="mt-3 truncate text-xs text-gray-400 dark:text-gray-500">
          {goalTitle} · {phaseTitle}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{topic.title}</h1>
          <span className="inline-flex items-center rounded bg-gray-50 px-2 py-0.5 text-xs text-gray-400 dark:bg-gray-800 dark:text-gray-500">
            {gd.week} {topic.week_number} · {topic.estimated_hrs}h
          </span>
          {isCompleted && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              {tl.completedBadge}
            </span>
          )}
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {topic.description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main column: bài giảng + bài kiểm tra */}
        <div className="space-y-6">
        {/* Lesson */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {tl.lessonHeading}
            </h2>
            {lesson !== null && !generatingLesson && (
              <button
                onClick={generateLesson}
                className="text-xs text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                {gd.regenerateLesson}
              </button>
            )}
          </div>

          {generatingLesson ? (
            <div className="flex items-center gap-2 py-8 text-sm text-gray-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300" />
              {gd.generatingLesson}
            </div>
          ) : lesson === null ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{tl.noLessonYet}</p>
              <button onClick={generateLesson} className="btn-primary mt-4">{gd.generateLesson}</button>
              {lessonError && <p className="mt-3 text-xs text-red-500 dark:text-red-400">{lessonError}</p>}
            </div>
          ) : (
            <div className="text-sm leading-relaxed">
              <Markdown content={lesson} />
            </div>
          )}
        </div>

        {/* Bài kiểm tra / hoàn thành */}
        {!isCompleted || showQuizAnyway ? (
          <div className="space-y-2">
            <TopicQuiz
              topicId={topic.id}
              onPassed={() => { setStatus("completed"); setShowQuizAnyway(false); }}
            />
            {!isCompleted && (
              <button
                onClick={toggleStatus}
                disabled={togglingStatus}
                className="text-xs text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50 dark:text-gray-500 dark:hover:text-gray-300"
              >
                {tq.manualComplete}
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{tl.completedBadge}</p>
            <div className="mt-3 flex flex-wrap gap-4">
              <button onClick={() => setShowQuizAnyway(true)} className="text-xs font-medium text-accent hover:underline">
                {tq.redoQuiz}
              </button>
              <button
                onClick={toggleStatus}
                disabled={togglingStatus}
                className="text-xs text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {tl.markIncomplete}
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Notes */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {tl.notesHeading}
              </h3>
              <span className="text-[11px] text-gray-400">
                {noteStatus === "saving" ? gd.noteSaving : noteStatus === "saved" ? gd.noteSaved : ""}
              </span>
            </div>
            <textarea
              value={note}
              onChange={(e) => changeNote(e.target.value)}
              placeholder={gd.notePlaceholder}
              rows={5}
              className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-accent/50 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          {/* Resources */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {tl.resourcesHeading}
              </h3>
              <button
                onClick={generateResources}
                disabled={loadingResources}
                className="text-[11px] text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50 dark:text-gray-500 dark:hover:text-gray-300"
              >
                {resources.length > 0 ? gd.regenerateLesson : gd.showResources}
              </button>
            </div>
            {loadingResources ? (
              <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                <div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-gray-600" />
              </div>
            ) : resources.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">—</p>
            ) : (
              <ul className="space-y-2">
                {resources.map((r) => (
                  <li key={r.id}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 text-xs text-gray-600 hover:text-accent dark:text-gray-300"
                    >
                      <span className="mt-0.5 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {TYPE_LABEL[r.type]}
                      </span>
                      <span className="group-hover:underline">{r.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Ask AI + Focus */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {tl.askHeading}
            </h3>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{tl.askDesc}</p>
            <Link href={askHref} className="btn-primary mt-3 block w-full text-center text-sm">
              {gd.askAi}
            </Link>
            <button
              onClick={() => window.dispatchEvent(new Event("pomodoro:open"))}
              className="mt-2 block w-full rounded-lg border border-gray-200 px-3 py-2 text-center text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {tl.startFocusHere}
            </button>
          </div>
        </aside>
      </div>

      {/* Prev / Next */}
      <div className="mt-8 flex items-stretch justify-between gap-3">
        {prev ? (
          <Link
            href={`/dashboard/goals/${goalId}/topics/${prev.id}`}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-accent/40 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-[11px] uppercase tracking-wider text-gray-400">← {tl.prev}</p>
            <p className="mt-0.5 truncate text-sm font-medium text-gray-900 dark:text-gray-100">{prev.title}</p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/dashboard/goals/${goalId}/topics/${next.id}`}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-right transition-colors hover:border-accent/40 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-[11px] uppercase tracking-wider text-gray-400">{tl.next} →</p>
            <p className="mt-0.5 truncate text-sm font-medium text-gray-900 dark:text-gray-100">{next.title}</p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
