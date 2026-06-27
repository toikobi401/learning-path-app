"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

type Row = {
  rank: number;
  user_id: string;
  name: string;
  avatar_url: string | null;
  minutes: number;
  isMe: boolean;
};
type Range = "today" | "week" | "all";

function fmtMinutes(min: number, hLabel: string, mLabel: string): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}${mLabel}`;
  return `${h}${hLabel} ${m}${mLabel}`;
}

// Màu nhấn cho top 3 (thay cho huy chương emoji)
function rankClass(rank: number): string {
  if (rank === 1) return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
  if (rank === 2) return "bg-gray-200 text-gray-700 dark:bg-gray-600/30 dark:text-gray-300";
  if (rank === 3) return "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400";
  return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
}

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const l = t.leaderboard;

  const [range, setRange] = useState<Range>("week");
  const [top, setTop] = useState<Row[]>([]);
  const [me, setMe] = useState<{ rank: number | null; minutes: number; optedIn: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r: Range) => {
    setLoading(true);
    const res = await fetch(`/api/leaderboard?range=${r}`);
    if (res.ok) {
      const data = await res.json();
      setTop(data.top);
      setMe(data.me);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  async function toggleOptIn(next: boolean) {
    setMe((m) => (m ? { ...m, optedIn: next } : m));
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaderboard_opt_in: next }),
    });
    load(range);
  }

  const hL = l.unitHour;
  const mL = l.unitMinute;

  const RANGES: [Range, string][] = [
    ["today", l.rangeToday],
    ["week", l.rangeWeek],
    ["all", l.rangeAll],
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-end justify-between border-b border-gray-200 pb-6 dark:border-gray-800">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            <span className="text-gradient">{l.title}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{l.subtitle}</p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new Event("pomodoro:open"))}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {l.focusLink}
        </button>
      </div>

      {/* Range tabs */}
      <div className="mb-5 inline-flex rounded-full border border-gray-200 bg-white p-1 text-sm dark:border-gray-800 dark:bg-gray-900">
        {RANGES.map(([r, label]) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              range === r
                ? "bg-accent/10 font-medium text-accent dark:bg-accent/15"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* My rank */}
      {me && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 px-5 py-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{l.myRank}</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-gray-100">
              {me.optedIn && me.rank ? `#${me.rank}` : "—"}{" "}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                · {fmtMinutes(me.minutes, hL, mL)}
              </span>
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={me.optedIn}
              onChange={(e) => toggleOptIn(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            {l.optIn}
          </label>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
        </div>
      ) : top.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{l.empty}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{l.emptyDesc}</p>
          <button onClick={() => window.dispatchEvent(new Event("pomodoro:open"))} className="btn-primary mt-4 inline-block">{l.startFocus}</button>
        </div>
      ) : (
        <div className="space-y-2">
          {top.map((row) => (
            <div
              key={row.user_id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                row.isMe
                  ? "border-accent/40 bg-accent/5"
                  : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${rankClass(row.rank)}`}>
                {row.rank}
              </span>
              {row.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent/30 to-accent/10 text-xs font-semibold text-accent">
                  {row.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {row.name}{row.isMe && <span className="ml-1 text-xs text-accent">· {l.you}</span>}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-300">
                {fmtMinutes(row.minutes, hL, mL)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
