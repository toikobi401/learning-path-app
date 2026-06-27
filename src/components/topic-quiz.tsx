"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

type Question = {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
};
type Phase = "idle" | "generating" | "answering" | "result";

const PASS_RATIO = 0.7;
const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function TopicQuiz({
  topicId,
  onPassed,
}: {
  topicId: string;
  /** Gọi khi đạt — cha cập nhật trạng thái hoàn thành (đã PATCH sẵn ở đây). */
  onPassed: () => void;
}) {
  const { t } = useLanguage();
  const q = t.topicQuiz;

  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setPhase("generating");
    setAnswers({});
    const res = await fetch(`/api/topics/${topicId}/quiz`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? q.error);
      setPhase("idle");
      return;
    }
    setQuestions(data.questions);
    setPhase("answering");
  }

  const correctCount = questions.reduce(
    (acc, qn, i) => acc + (answers[i] === qn.correct_index ? 1 : 0),
    0
  );
  const ratio = questions.length > 0 ? correctCount / questions.length : 0;
  const passed = ratio >= PASS_RATIO;
  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  async function submit() {
    setPhase("result");
    if (ratio >= PASS_RATIO) {
      await fetch(`/api/topics/${topicId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      onPassed();
    }
  }

  // ── Idle ──
  if (phase === "idle") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{q.title}</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{q.desc}</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{q.passThresholdNote}</p>
        <button onClick={generate} className="btn-primary mt-4">{q.generate}</button>
        {error && <p className="mt-3 text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  // ── Generating ──
  if (phase === "generating") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 py-6 text-sm text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300" />
          {q.generating}
        </div>
      </div>
    );
  }

  const showResult = phase === "result";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{q.title}</h2>
        {!showResult && (
          <span className="text-xs text-gray-400">
            {q.answered} {Object.keys(answers).length}/{questions.length}
          </span>
        )}
      </div>

      {/* Result banner */}
      {showResult && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 ${
            passed
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
              : "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
          }`}
        >
          <p className={`text-sm font-semibold ${passed ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
            {passed ? q.passed : q.failed} · {q.scoreLabel}: {correctCount}/{questions.length} ({Math.round(ratio * 100)}%)
          </p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{passed ? q.passedDesc : q.failedDesc}</p>
        </div>
      )}

      <div className="space-y-5">
        {questions.map((qn, i) => {
          const chosen = answers[i];
          return (
            <div key={i}>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {i + 1}. {qn.question}
              </p>
              <div className="mt-2 space-y-1.5">
                {qn.options.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  const isCorrect = qn.correct_index === oi;
                  let cls =
                    "border-gray-200 bg-white hover:border-accent/40 dark:border-gray-700 dark:bg-gray-900";
                  if (showResult) {
                    if (isCorrect) cls = "border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10";
                    else if (isChosen) cls = "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10";
                    else cls = "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900";
                  } else if (isChosen) {
                    cls = "border-accent/50 bg-accent/5";
                  }
                  return (
                    <button
                      key={oi}
                      disabled={showResult}
                      onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                      className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default ${cls}`}
                    >
                      <span className="shrink-0 font-semibold text-gray-400">{OPTION_LETTERS[oi]}.</span>
                      <span className="text-gray-700 dark:text-gray-200">{opt}</span>
                    </button>
                  );
                })}
              </div>
              {showResult && qn.explanation && (
                <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {qn.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        {!showResult ? (
          <button onClick={submit} disabled={!allAnswered} className="btn-primary disabled:opacity-50">
            {q.submit}
          </button>
        ) : (
          <button onClick={generate} className="btn-primary">
            {passed ? q.regenerate : q.retry}
          </button>
        )}
      </div>
    </div>
  );
}
