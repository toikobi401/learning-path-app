"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

type Mode = "focus" | "break" | "longBreak";
type Goal = { id: string; title: string; status: string };
type Config = {
  pomodoro_focus_min: number;
  pomodoro_break_min: number;
  pomodoro_long_break_min: number;
  pomodoro_rounds: number;
};
type Totals = { today: number; week: number; all: number };

const DEFAULT_CONFIG: Config = {
  pomodoro_focus_min: 25,
  pomodoro_break_min: 5,
  pomodoro_long_break_min: 15,
  pomodoro_rounds: 4,
};

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => ctx.close();
  } catch {
    /* bỏ qua nếu trình duyệt chặn audio */
  }
}

function fmt(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtMinutes(min: number, hL: string, mL: string): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h === 0 ? `${m}${mL}` : `${h}${hL} ${m}${mL}`;
}

export default function PomodoroWidget() {
  const { t } = useLanguage();
  const p = t.focus;

  const [open, setOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalId, setGoalId] = useState("");
  const [totals, setTotals] = useState<Totals | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // ── Trạng thái đồng hồ (giữ ở widget để vẫn chạy khi thu nhỏ) ──
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_CONFIG.pomodoro_focus_min * 60);
  const [running, setRunning] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const durationFor = useCallback(
    (m: Mode): number =>
      (m === "focus"
        ? config.pomodoro_focus_min
        : m === "break"
          ? config.pomodoro_break_min
          : config.pomodoro_long_break_min) * 60,
    [config]
  );

  // Mở widget từ nơi khác qua sự kiện "pomodoro:open"
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("pomodoro:open", handler);
    return () => window.removeEventListener("pomodoro:open", handler);
  }, []);

  // Nạp cấu hình + mục tiêu + thống kê
  const loadTotals = useCallback(async () => {
    const res = await fetch("/api/study-sessions");
    if (res.ok) setTotals((await res.json()).totals);
  }, []);

  useEffect(() => {
    (async () => {
      const [gRes, sRes] = await Promise.all([fetch("/api/goals"), fetch("/api/settings")]);
      if (gRes.ok) {
        const data = (await gRes.json()) as Goal[];
        setGoals(data.filter((g) => g.status !== "completed"));
      }
      if (sRes.ok) {
        const s = await sRes.json();
        setConfig({
          pomodoro_focus_min: s.pomodoro_focus_min ?? 25,
          pomodoro_break_min: s.pomodoro_break_min ?? 5,
          pomodoro_long_break_min: s.pomodoro_long_break_min ?? 15,
          pomodoro_rounds: s.pomodoro_rounds ?? 4,
        });
      }
      loadTotals();
    })();
  }, [loadTotals]);

  // Khi đổi cấu hình lúc đang dừng → cập nhật lại thời gian
  useEffect(() => {
    if (!running) setSecondsLeft(durationFor(mode));
  }, [durationFor, mode, running]);

  const onFocusComplete = useCallback(
    async (minutes: number) => {
      await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes, goalId: goalId || null, source: "pomodoro" }),
      });
      loadTotals();
    },
    [goalId, loadTotals]
  );

  const finishPhase = useCallback(() => {
    beep();
    if (mode === "focus") {
      onFocusComplete(config.pomodoro_focus_min);
      const next = completedRounds + 1;
      setCompletedRounds(next);
      const nextMode: Mode = next % config.pomodoro_rounds === 0 ? "longBreak" : "break";
      setMode(nextMode);
      setSecondsLeft(durationFor(nextMode));
    } else {
      setMode("focus");
      setSecondsLeft(durationFor("focus"));
    }
    setRunning(false);
  }, [mode, completedRounds, config.pomodoro_focus_min, config.pomodoro_rounds, onFocusComplete, durationFor]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (running && secondsLeft === 0) finishPhase();
  }, [running, secondsLeft, finishPhase]);

  useEffect(() => {
    if (running) {
      const label = mode === "focus" ? p.modeFocus : p.modeBreak;
      document.title = `${fmt(secondsLeft)} · ${label}`;
    } else {
      document.title = "PathAI";
    }
    return () => { document.title = "PathAI"; };
  }, [running, secondsLeft, mode, p.modeFocus, p.modeBreak]);

  function switchMode(m: Mode) {
    setRunning(false);
    setMode(m);
    setSecondsLeft(durationFor(m));
  }
  function reset() {
    setRunning(false);
    setSecondsLeft(durationFor(mode));
  }

  async function saveConfig(next: Config) {
    setConfig(next);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  const total = durationFor(mode);
  const progress = total > 0 ? 1 - secondsLeft / total : 0;
  const ring = mode === "focus" ? "stroke-accent" : mode === "break" ? "stroke-emerald-500" : "stroke-blue-500";
  const accentText = mode === "focus" ? "text-accent" : mode === "break" ? "text-emerald-500" : "text-blue-500";
  const R = 64;
  const C = 2 * Math.PI * R;
  const hL = p.unitHour;
  const mL = p.unitMinute;

  // ── Pill thu nhỏ ──
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="glass fixed right-6 top-20 z-30 flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--border)_70%,transparent)] px-4 py-2 shadow-lg transition-transform hover:scale-105"
        aria-label={p.title}
      >
        <svg className={`h-4 w-4 ${running ? accentText : "text-gray-500 dark:text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`text-sm font-semibold tabular-nums ${running ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}>
          {running ? fmt(secondsLeft) : p.title}
        </span>
      </button>
    );
  }

  // ── Panel mở rộng ──
  return (
    <div className="fixed right-6 top-20 z-30 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.title}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConfig((v) => !v)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            title={p.configTitle}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Mode tabs */}
        <div className="mb-4 flex justify-center">
          <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-0.5 text-xs dark:border-gray-700 dark:bg-gray-800">
            {([
              ["focus", p.modeFocus],
              ["break", p.modeBreak],
              ["longBreak", p.modeLongBreak],
            ] as [Mode, string][]).map(([m, label]) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  mode === m
                    ? "bg-white font-medium text-accent shadow-sm dark:bg-gray-900"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Ring + time */}
        <div className="relative mx-auto h-40 w-40">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={R} className="fill-none stroke-gray-200 dark:stroke-gray-800" strokeWidth="8" />
            <circle
              cx="80"
              cy="80"
              r={R}
              className={`fill-none ${ring} transition-[stroke-dashoffset] duration-500`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{fmt(secondsLeft)}</span>
            <span className={`mt-1 text-[11px] font-medium uppercase tracking-wider ${accentText}`}>
              {mode === "focus" ? p.modeFocus : mode === "break" ? p.modeBreak : p.modeLongBreak}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setRunning((r) => !r)} className="btn-primary min-w-24 text-sm">
            {running ? p.pause : secondsLeft === durationFor(mode) ? p.start : p.resume}
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {p.reset}
          </button>
        </div>

        {/* Goal selector */}
        {goals.length > 0 && (
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-accent/50 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">{p.noGoal}</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        )}

        {/* Stats + leaderboard */}
        {totals && (
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {p.statToday}: <span className="font-semibold text-gray-800 dark:text-gray-200">{fmtMinutes(totals.today, hL, mL)}</span>
            </span>
            <Link href="/dashboard/leaderboard" onClick={() => setOpen(false)} className="font-medium text-accent hover:underline">
              {t.leaderboard.title}
            </Link>
          </div>
        )}

        {/* Config */}
        {showConfig && (
          <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{p.configTitle}</span>
              {savedFlash && <span className="text-[11px] text-emerald-600 dark:text-emerald-400">{p.saved}</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["pomodoro_focus_min", p.cfgFocus, 1, 180],
                ["pomodoro_break_min", p.cfgBreak, 1, 60],
                ["pomodoro_long_break_min", p.cfgLongBreak, 1, 120],
                ["pomodoro_rounds", p.cfgRounds, 1, 12],
              ] as [keyof Config, string, number, number][]).map(([key, label, min, max]) => (
                <div key={key}>
                  <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">{label}</label>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={config[key]}
                    onChange={(e) => {
                      const v = Math.min(max, Math.max(min, Math.round(Number(e.target.value) || min)));
                      saveConfig({ ...config, [key]: v });
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-accent/50 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
