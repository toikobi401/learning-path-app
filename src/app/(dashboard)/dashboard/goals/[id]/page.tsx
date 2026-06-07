"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ─── Domain types ────────────────────────────────────────────────────────────
type TopicStatus = "not_started" | "in_progress" | "completed";
type ResourceType = "article" | "video" | "course" | "doc";
type QuizDifficulty = "easy" | "medium" | "hard";
type QuestionType = "mcq" | "essay";

type Resource = {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  source: "ai_suggested" | "user_added";
};

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
type ResourcesMap = Record<string, Resource[] | null>;

// Quiz types
type PhaseQuizQuestion = {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[] | null;
  order_index: number;
};

type PhaseAttemptSummary = {
  id: string;
  score: number;
  completed_at: string;
};

type PhaseQuizData = {
  id: string;
  difficulty: QuizDifficulty;
  questions: PhaseQuizQuestion[];
  attempts: PhaseAttemptSummary[];
};

type PracticeQuestion = {
  type: QuestionType;
  question: string;
  options?: string[];
  correct_index?: number;
  explanation?: string;
  model_answer?: string;
  grading_criteria?: string[];
};

type FeedbackEntry = {
  question: string;
  type: string;
  score: number;
  max_score: number;
  correct_index?: number;
  chosen_index?: number;
  options?: string[];
  explanation?: string;
  feedback?: string;
};

type SubmittedAnswer =
  | { type: "mcq"; chosen_index: number }
  | { type: "essay"; essay_text: string };

// ─── Styling constants ────────────────────────────────────────────────────────
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

const PHASE_BAR = ["bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-green-500"];

const RESOURCE_TYPE_STYLE: Record<ResourceType, string> = {
  article: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  video: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  course: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  doc: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

// ─── Small shared components ─────────────────────────────────────────────────
function CheckCircle({ status, loading }: { status: TopicStatus; loading: boolean }) {
  if (loading)
    return <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin dark:border-gray-600" />;
  if (status === "completed")
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  if (status === "in_progress")
    return (
      <div className="h-5 w-5 rounded-full border-2 border-blue-400 dark:border-blue-600">
        <div className="m-0.5 h-2.5 w-2.5 rounded-full bg-blue-400 dark:bg-blue-600" />
      </div>
    );
  return <div className="h-5 w-5 rounded-full border-2 border-gray-300 transition-colors group-hover:border-green-400 dark:border-gray-600 dark:group-hover:border-green-500" />;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  return <span className={`text-5xl font-bold tabular-nums ${color}`}>{score}%</span>;
}

function ResourcesSection({
  topicId,
  resources,
  onLoad,
}: {
  topicId: string;
  resources: Resource[] | null | undefined;
  onLoad: (topicId: string, data: Resource[]) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateResources() {
    setError(null);
    setGenerating(true);
    const res = await fetch(`/api/topics/${topicId}/resources`, { method: "POST" });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) { setError(data.error ?? "Failed to generate resources."); return; }
    onLoad(topicId, data);
  }

  if (resources === null)
    return (
      <div className="flex items-center gap-2 pt-2 text-xs text-gray-400">
        <div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-gray-600" />
        Loading resources…
      </div>
    );
  if (resources === undefined) return null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
      {generating && (
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-400" />
          Generating resource suggestions…
        </div>
      )}
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      {!generating && resources.length === 0 && (
        <button onClick={generateResources} className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          + Generate AI resource suggestions
        </button>
      )}
      {resources.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Resources</p>
            {!generating && (
              <button onClick={generateResources} className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">Refresh</button>
            )}
          </div>
          <div className="space-y-1.5">
            {resources.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md p-1.5 text-xs transition hover:bg-gray-50 dark:hover:bg-gray-800">
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${RESOURCE_TYPE_STYLE[r.type]}`}>{r.type}</span>
                <span className="truncate text-gray-700 underline-offset-2 hover:underline dark:text-gray-300">{r.title}</span>
                <svg className="ml-auto h-3 w-3 shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quiz Modal ───────────────────────────────────────────────────────────────
type QuizMode = "phase" | "practice";
type QuizPhase = "mode-select" | "loading" | "settings" | "generating" | "question" | "grading" | "result";

function QuizModal({ phase, onClose }: { phase: Phase; onClose: () => void }) {
  const [mode, setMode] = useState<QuizMode>("phase");
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("mode-select");

  // Phase quiz state
  const [phaseQuiz, setPhaseQuiz] = useState<PhaseQuizData | null>(null);

  // Practice settings
  const [practiceCount, setPracticeCount] = useState(5);
  const [practiceDifficulty, setPracticeDifficulty] = useState<QuizDifficulty>("medium");
  const [practiceTypes, setPracticeTypes] = useState<QuestionType[]>(["mcq"]);

  // Active quiz (both modes)
  const [questions, setQuestions] = useState<(PhaseQuizQuestion | PracticeQuestion)[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<SubmittedAnswer[]>([]);
  const [essayDraft, setEssayDraft] = useState<Record<number, string>>({});

  // Results
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [pastAttempts, setPastAttempts] = useState<PhaseAttemptSummary[]>([]);

  const [error, setError] = useState<string | null>(null);

  // Load phase quiz on mount
  useEffect(() => {
    async function load() {
      setQuizPhase("loading");
      const res = await fetch(`/api/phases/${phase.id}/quiz`);
      if (res.ok) {
        const data = await res.json() as PhaseQuizData | null;
        if (data) {
          setPhaseQuiz(data);
          setPastAttempts(data.attempts ?? []);
          if (data.attempts.length > 0)
            setBestScore(Math.max(...data.attempts.map((a) => a.score)));
        }
      }
      setQuizPhase("mode-select");
    }
    load();
  }, [phase.id]);

  // ── Start phase quiz ──
  function startPhaseQuiz() {
    if (!phaseQuiz) return;
    setMode("phase");
    setQuestions(phaseQuiz.questions);
    setAnswers(phaseQuiz.questions.map((q) => q.type === "mcq" ? { type: "mcq", chosen_index: -1 } : { type: "essay", essay_text: "" }));
    setEssayDraft({});
    setCurrentQ(0);
    setError(null);
    setQuizPhase("question");
  }

  // ── Start practice: show settings ──
  function openSettings() {
    setMode("practice");
    setError(null);
    setQuizPhase("settings");
  }

  // ── Generate practice questions ──
  async function generatePractice() {
    setQuizPhase("generating");
    setError(null);
    const res = await fetch(`/api/phases/${phase.id}/practice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: practiceCount, difficulty: practiceDifficulty, types: practiceTypes }),
    });
    const data = await res.json() as { questions?: PracticeQuestion[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to generate questions.");
      setQuizPhase("settings");
      return;
    }
    const qs = data.questions ?? [];
    setQuestions(qs);
    setAnswers(qs.map((q) => q.type === "mcq" ? { type: "mcq", chosen_index: -1 } : { type: "essay", essay_text: "" }));
    setEssayDraft({});
    setCurrentQ(0);
    setQuizPhase("question");
  }

  // ── Answer handlers ──
  function chooseMcq(optIdx: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = { type: "mcq", chosen_index: optIdx };
      return next;
    });
  }

  function updateEssay(text: string) {
    setEssayDraft((d) => ({ ...d, [currentQ]: text }));
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = { type: "essay", essay_text: text };
      return next;
    });
  }

  // ── Submit ──
  async function submitQuiz() {
    setQuizPhase("grading");
    setError(null);

    // Finalise any pending essay drafts
    const finalAnswers = answers.map((a, i) => {
      if (a.type === "essay" && essayDraft[i] !== undefined)
        return { type: "essay" as const, essay_text: essayDraft[i] };
      return a;
    });

    let res: Response;
    if (mode === "phase" && phaseQuiz) {
      res = await fetch(`/api/phases/${phase.id}/quiz/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });
    } else {
      res = await fetch(`/api/phases/${phase.id}/practice/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions,
          answers: finalAnswers,
          difficulty: practiceDifficulty,
          types: practiceTypes,
        }),
      });
    }

    const data = await res.json() as { score?: number; feedback?: FeedbackEntry[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Grading failed.");
      setQuizPhase("question");
      return;
    }
    setScore(data.score ?? 0);
    setFeedback(data.feedback ?? []);
    if (mode === "phase") {
      const s = data.score ?? 0;
      setBestScore((prev) => (prev === null ? s : Math.max(prev, s)));
      setPastAttempts((prev) => [{ id: Date.now().toString(), score: s, completed_at: new Date().toISOString() }, ...prev]);
    }
    setQuizPhase("result");
  }

  const currentQuestion = questions[currentQ];
  const currentAnswer = answers[currentQ];
  const currentEssayText = essayDraft[currentQ] ?? (currentAnswer?.type === "essay" ? currentAnswer.essay_text : "");

  const allAnswered = answers.every((a) =>
    a.type === "mcq" ? a.chosen_index >= 0 : a.essay_text.trim().length > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-xl flex-col rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 max-h-[90vh]">

        {/* Modal header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Quiz</p>
            <h2 className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{phase.title}</h2>
          </div>
          <div className="ml-4 flex shrink-0 items-center gap-3">
            {bestScore !== null && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Best <span className="font-semibold text-gray-700 dark:text-gray-300">{bestScore}%</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Loading */}
          {quizPhase === "loading" && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading quiz…</p>
            </div>
          )}

          {/* Mode select */}
          {quizPhase === "mode-select" && (
            <div className="space-y-4">
              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>}

              {/* Phase Quiz card */}
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Phase Quiz</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      Official quiz auto-generated for this phase · {phaseQuiz ? `${phaseQuiz.questions.length} questions` : "not ready yet"}
                    </p>
                    {pastAttempts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {pastAttempts.slice(0, 3).map((a) => (
                          <span key={a.id} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${a.score >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : a.score >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                            {a.score}%
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={startPhaseQuiz}
                    disabled={!phaseQuiz || phaseQuiz.questions.length === 0}
                    className="shrink-0 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
                  >
                    Start
                  </button>
                </div>
              </div>

              {/* Practice card */}
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Practice Quiz</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      Generate fresh questions with custom options · scores saved, questions temporary
                    </p>
                  </div>
                  <button
                    onClick={openSettings}
                    className="shrink-0 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Configure
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Practice settings */}
          {quizPhase === "settings" && (
            <div className="space-y-5">
              <button onClick={() => setQuizPhase("mode-select")} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                ← Back
              </button>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Practice settings</h3>
              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>}

              {/* Question count */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Number of questions</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((n) => (
                    <button
                      key={n}
                      onClick={() => setPracticeCount(n)}
                      className={`flex-1 rounded-md border py-1.5 text-xs font-semibold transition ${practiceCount === n ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
                <div className="flex gap-2">
                  {(["easy", "medium", "hard"] as QuizDifficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setPracticeDifficulty(d)}
                      className={`flex-1 rounded-md border py-1.5 text-xs font-semibold capitalize transition ${practiceDifficulty === d ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question types */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Question types</label>
                <div className="flex gap-2">
                  {([["mcq", "Multiple choice"], ["essay", "Essay"], ["mcq", "Mixed"]] as const).map(([val, label], i) => {
                    const isMixed = i === 2;
                    const isActive = isMixed
                      ? practiceTypes.includes("mcq") && practiceTypes.includes("essay")
                      : !isMixed && practiceTypes.length === 1 && practiceTypes[0] === val;
                    return (
                      <button
                        key={label}
                        onClick={() => {
                          if (isMixed) setPracticeTypes(["mcq", "essay"]);
                          else setPracticeTypes([val]);
                        }}
                        className={`flex-1 rounded-md border py-1.5 text-xs font-semibold transition ${isActive ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500"}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={generatePractice}
                className="w-full rounded-md bg-gray-900 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
              >
                Generate questions
              </button>
            </div>
          )}

          {/* Generating */}
          {quizPhase === "generating" && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Generating {practiceCount} questions…</p>
            </div>
          )}

          {/* Question */}
          {quizPhase === "question" && currentQuestion && (
            <div>
              {/* Progress dots */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentQ + 1} / {questions.length}
                  <span className="ml-2 capitalize text-gray-400 dark:text-gray-600">· {currentQuestion.type === "mcq" ? "Multiple choice" : "Essay"}</span>
                </span>
                <div className="flex gap-1">
                  {questions.map((_q, i) => {
                    const ans = answers[i];
                    const answered = ans?.type === "mcq" ? ans.chosen_index >= 0 : (essayDraft[i] ?? ans?.essay_text ?? "").trim().length > 0;
                    return (
                      <button key={i} onClick={() => setCurrentQ(i)}
                        className={`rounded-full transition-all ${i === currentQ ? "h-2 w-4 bg-gray-900 dark:bg-gray-100" : answered ? "h-2 w-2 bg-green-400" : "h-2 w-2 bg-gray-200 dark:bg-gray-700"}`}
                      />
                    );
                  })}
                </div>
              </div>

              <p className="mb-5 text-sm font-medium leading-relaxed text-gray-900 dark:text-gray-100">
                {currentQuestion.question}
              </p>

              {/* MCQ options */}
              {currentQuestion.type === "mcq" && "options" in currentQuestion && currentQuestion.options && (
                <div className="space-y-2">
                  {(currentQuestion.options as string[]).map((opt, optIdx) => {
                    const chosen = answers[currentQ]?.type === "mcq" && answers[currentQ].chosen_index === optIdx;
                    return (
                      <button key={optIdx} onClick={() => chooseMcq(optIdx)}
                        className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-all ${chosen ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500"}`}
                      >
                        <span className="mr-3 font-semibold">{String.fromCharCode(65 + optIdx)}.</span>{opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Essay textarea */}
              {currentQuestion.type === "essay" && (
                <textarea
                  value={currentEssayText}
                  onChange={(e) => updateEssay(e.target.value)}
                  placeholder="Write your answer here…"
                  rows={6}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-gray-100"
                />
              )}

              {/* Navigation */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
                  disabled={currentQ === 0}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-30 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  ← Prev
                </button>
                {currentQ < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQ((q) => q + 1)}
                    className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={submitQuiz}
                    disabled={!allAnswered}
                    className="rounded-md bg-green-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-40"
                  >
                    Submit & grade
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grading */}
          {quizPhase === "grading" && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600 dark:border-gray-700 dark:border-t-indigo-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">AI is grading your answers…</p>
            </div>
          )}

          {/* Result */}
          {quizPhase === "result" && (
            <div>
              <div className="mb-5 flex flex-col items-center gap-2 py-4">
                <ScoreRing score={score} />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {score >= 80 ? "Excellent work!" : score >= 60 ? "Good effort — review below." : "Keep studying — you got this!"}
                </p>
              </div>

              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {feedback.map((f, i) => {
                  const isCorrect = f.type === "mcq" ? f.chosen_index === f.correct_index : f.score >= 7;
                  return (
                    <div key={i} className={`rounded-lg border p-3 text-xs ${isCorrect ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"}`}>
                      <div className="flex items-start gap-2">
                        <span className={isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          {isCorrect ? "✓" : "✗"}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium text-gray-800 dark:text-gray-200">{f.question}</p>
                          {f.type === "mcq" && (
                            <>
                              {f.chosen_index !== f.correct_index && (
                                <p className="text-gray-500 dark:text-gray-400">Your answer: <span className="font-medium text-red-600 dark:text-red-400">{f.options?.[f.chosen_index ?? -1] ?? "—"}</span></p>
                              )}
                              <p className="text-gray-500 dark:text-gray-400">Correct: <span className="font-medium text-green-700 dark:text-green-400">{f.options?.[f.correct_index ?? -1] ?? "—"}</span></p>
                              {f.explanation && <p className="italic text-gray-400 dark:text-gray-500">{f.explanation}</p>}
                            </>
                          )}
                          {f.type === "essay" && (
                            <>
                              <p className="text-gray-500 dark:text-gray-400">Score: <span className="font-semibold text-gray-700 dark:text-gray-300">{f.score}/{f.max_score}</span></p>
                              {f.feedback && <p className="italic text-gray-400 dark:text-gray-500">{f.feedback}</p>}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    setCurrentQ(0);
                    setAnswers(questions.map((q) => q.type === "mcq" ? { type: "mcq", chosen_index: -1 } : { type: "essay", essay_text: "" }));
                    setEssayDraft({});
                    setQuizPhase("question");
                  }}
                  className="flex-1 rounded-md border border-gray-200 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Retake
                </button>
                <button
                  onClick={() => setQuizPhase("mode-select")}
                  className="flex-1 rounded-md bg-gray-900 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900"
                >
                  Back to menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [resourcesMap, setResourcesMap] = useState<ResourcesMap>({});
  const [quizPhase, setQuizPhase] = useState<Phase | null>(null);

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
      for (const [topicId, log] of Object.entries(data)) map[topicId] = log.status;
      setProgress(map);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleGenerate() {
    setGenerateError(null);
    setGenerating(true);
    const res = await fetch(`/api/goals/${id}/generate`, { method: "POST" });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) { setGenerateError(data.error ?? "Generation failed."); return; }
    setPath(data.path);
    setProgress({});
    setExpandedResources(new Set());
    setResourcesMap({});
  }

  async function toggleTopic(topicId: string) {
    const current = progress[topicId] ?? "not_started";
    const next: TopicStatus = current === "completed" ? "not_started" : "completed";
    setProgress((p) => ({ ...p, [topicId]: next }));
    setToggling(topicId);
    const res = await fetch(`/api/topics/${topicId}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setToggling(null);
    if (!res.ok) setProgress((p) => ({ ...p, [topicId]: current }));
  }

  async function toggleResources(topicId: string) {
    const next = new Set(expandedResources);
    if (next.has(topicId)) { next.delete(topicId); setExpandedResources(next); return; }
    next.add(topicId);
    setExpandedResources(next);
    if (resourcesMap[topicId] !== undefined) return;
    setResourcesMap((m) => ({ ...m, [topicId]: null }));
    const res = await fetch(`/api/topics/${topicId}/resources`);
    if (res.ok) {
      const data = await res.json() as Resource[];
      setResourcesMap((m) => ({ ...m, [topicId]: data }));
    } else {
      setResourcesMap((m) => ({ ...m, [topicId]: [] }));
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
        <Link href="/dashboard/goals" className="underline">Back to goals</Link>
      </div>
    );
  }

  const deadline = new Date(goal.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const allTopics = path?.phases.flatMap((p) => p.topics) ?? [];
  const totalTopics = allTopics.length;
  const totalCompleted = allTopics.filter((t) => (progress[t.id] ?? "not_started") === "completed").length;
  const progressPct = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;
  const totalHours = allTopics.reduce((sum, t) => sum + t.estimated_hrs, 0);

  return (
    <div className="max-w-3xl">
      {/* Quiz modal */}
      {quizPhase && <QuizModal phase={quizPhase} onClose={() => setQuizPhase(null)} />}

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link href="/dashboard/goals" className="hover:text-gray-700 dark:hover:text-gray-300">Goals</Link>
        <span>/</span>
        <span className="truncate text-gray-600 dark:text-gray-300">{goal.title}</span>
      </div>

      {/* Goal header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${LEVEL_COLOR[goal.level]}`}>{goal.level}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{goal.hours_per_day}h/day &middot; Due {deadline}</span>
            </div>
            <h1 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{goal.title}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{goal.description}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {path && (
              <button onClick={handleGenerate} disabled={generating}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
                {generating ? "Regenerating…" : "Regenerate"}
              </button>
            )}
            <Link href={`/dashboard/chat?goalId=${goal.id}`}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
              Chat about this
            </Link>
          </div>
        </div>

        {path && (
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
            <div className="flex flex-wrap gap-5">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Duration</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{path.total_weeks} weeks</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Phases</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{path.phases.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Topics</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{totalCompleted}/{totalTopics}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Est. hours</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{Math.round(totalHours)}h</p>
              </div>
            </div>
            {totalTopics > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>Overall progress</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-2 rounded-full bg-green-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {generateError && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{generateError}</p>
      )}

      {generating && (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Generating your personalized path…</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">This usually takes 15–30 seconds. Phase quizzes are generated in the background.</p>
          </div>
        </div>
      )}

      {!path && !generating && (
        <div className="mt-4 flex flex-col items-center gap-5 rounded-lg border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">No learning path yet</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-400">
              PathAI will analyze your goal and create a structured, week-by-week curriculum tailored to your level and schedule.
            </p>
          </div>
          <button onClick={handleGenerate}
            className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">
            Generate learning path
          </button>
        </div>
      )}

      {/* Learning path */}
      {path && !generating && (
        <div className="mt-4 space-y-4">
          {path.raw_json?.overview && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Overview</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{path.raw_json.overview}</p>
            </div>
          )}

          {path.phases.map((phase, phaseIdx) => {
            const phaseCompleted = phase.topics.filter((t) => (progress[t.id] ?? "not_started") === "completed").length;
            const phaseTotal = phase.topics.length;
            const phasePct = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;

            return (
              <div key={phase.id}
                className={`overflow-hidden rounded-lg border border-l-4 border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${PHASE_BORDER[phaseIdx % PHASE_BORDER.length]}`}>
                {/* Phase header */}
                <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Phase {phase.order_index + 1}: {phase.title}
                    </h2>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{phaseCompleted}/{phaseTotal}</span>
                      <button
                        onClick={() => setQuizPhase(phase)}
                        className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
                      >
                        Quiz
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className={`h-1 rounded-full transition-all duration-500 ${PHASE_BAR[phaseIdx % PHASE_BAR.length]}`} style={{ width: `${phasePct}%` }} />
                  </div>
                </div>

                {/* Topics */}
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {phase.topics.map((topic) => {
                    const status: TopicStatus = progress[topic.id] ?? "not_started";
                    const isCompleted = status === "completed";
                    const isToggling = toggling === topic.id;
                    const isResourcesExpanded = expandedResources.has(topic.id);

                    return (
                      <div key={topic.id}
                        className={`px-5 py-4 transition-colors ${isCompleted ? "bg-gray-50/50 dark:bg-gray-800/30" : ""}`}>
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleTopic(topic.id)} disabled={isToggling}
                            className="group mt-0.5 shrink-0 cursor-pointer disabled:cursor-default"
                            title={isCompleted ? "Mark as incomplete" : "Mark as complete"}>
                            <CheckCircle status={status} loading={isToggling} />
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400 dark:bg-gray-800 dark:text-gray-500">Week {topic.week_number}</span>
                              <h3 className={`text-sm font-medium transition-colors ${isCompleted ? "text-gray-400 line-through dark:text-gray-500" : "text-gray-900 dark:text-gray-100"}`}>
                                {topic.title}
                              </h3>
                            </div>
                            <p className={`mt-1.5 text-xs leading-relaxed transition-colors ${isCompleted ? "text-gray-400 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"}`}>
                              {topic.description}
                            </p>
                            <button
                              onClick={() => toggleResources(topic.id)}
                              className="mt-2 text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            >
                              {isResourcesExpanded ? "Hide resources ↑" : "Resources ↓"}
                            </button>
                            {isResourcesExpanded && (
                              <ResourcesSection
                                topicId={topic.id}
                                resources={resourcesMap[topic.id]}
                                onLoad={(topicId, data) => setResourcesMap((m) => ({ ...m, [topicId]: data }))}
                              />
                            )}
                          </div>
                          <span className="shrink-0 whitespace-nowrap text-xs font-medium text-gray-400 dark:text-gray-500">{topic.estimated_hrs}h</span>
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
