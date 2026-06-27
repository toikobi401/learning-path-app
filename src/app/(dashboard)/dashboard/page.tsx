import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerTranslations } from "@/lib/i18n/server";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { Aurora } from "@/components/motion/aurora";

function calcStreak(dates: (Date | null)[]): number {
  const dateSet = new Set(
    dates.filter(Boolean).map((d) => d!.toISOString().split("T")[0])
  );
  let streak = 0;
  const check = new Date();
  check.setHours(0, 0, 0, 0);
  if (!dateSet.has(check.toISOString().split("T")[0])) {
    check.setDate(check.getDate() - 1);
  }
  while (dateSet.has(check.toISOString().split("T")[0])) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [{ t }, activeGoals, completedLogs, thisWeekCount, recentActivity] = await Promise.all([
    getServerTranslations(userId),
    prisma.goal.count({ where: { user_id: userId, status: "active" } }),
    prisma.progressLog.findMany({
      where: { user_id: userId, status: "completed" },
      select: { completed_at: true, topic: { select: { estimated_hrs: true } } },
    }),
    prisma.progressLog.count({
      where: { user_id: userId, status: "completed", completed_at: { gte: sevenDaysAgo } },
    }),
    prisma.progressLog.findMany({
      where: { user_id: userId, status: "completed" },
      orderBy: { completed_at: "desc" },
      take: 5,
      select: {
        completed_at: true,
        topic: {
          select: {
            title: true,
            estimated_hrs: true,
            phase: {
              select: { path: { select: { goal: { select: { id: true, title: true } } } } },
            },
          },
        },
      },
    }),
  ]);

  const completedTopics = completedLogs.length;
  const totalHoursStudied = Math.round(
    completedLogs.reduce((sum, l) => sum + (l.topic?.estimated_hrs ?? 0), 0)
  );
  const streak = calcStreak(completedLogs.map((l) => l.completed_at));
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const d = t.dashboard;

  return (
    <div>
      <Reveal className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {d.greeting} <span className="text-gradient">{firstName}</span>.
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{d.subtitle}</p>
      </Reveal>

      {activeGoals === 0 && completedTopics === 0 && (
        <Reveal variant="scale">
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-white px-8 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
            <Aurora className="absolute inset-0 opacity-50" />
            <div className="relative">
              <div className="mx-auto flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-linear-to-br from-accent to-accent-3 text-white shadow-xl shadow-accent/30">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <h2 className="mt-5 text-base font-semibold text-gray-900 dark:text-gray-100">{d.noGoals}</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">{d.noGoalsDesc}</p>
              <Link
                href="/dashboard/goals/new"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-accent/40 hover:brightness-110"
              >
                {d.createFirstGoal}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
          </div>
        </Reveal>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: d.activeGoals,
            value: activeGoals,
            tint: "bg-accent/10 text-accent ring-1 ring-accent/20",
            icon: (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
              </>
            ),
          },
          {
            label: d.topicsCompleted,
            value: completedTopics,
            tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ),
          },
          {
            label: d.thisWeek,
            value: thisWeekCount,
            suffix: thisWeekCount === 1 ? ` ${d.topic}` : ` ${d.topics}`,
            tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 11.25h13.5A2.25 2.25 0 0121 13.5v5.25" />
            ),
          },
          {
            label: d.dayStreak,
            value: streak,
            suffix: streak === 1 ? ` ${d.day}` : ` ${d.days}`,
            tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
            ),
          },
        ].map((stat, i) => (
          <Reveal key={stat.label} delay={i * 80}>
            <div className="spotlight-card group relative h-full overflow-hidden rounded-xl border border-gray-200 bg-white px-6 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] hover:shadow-xl hover:shadow-accent/10 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {stat.label}
                </p>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${stat.tint}`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {stat.icon}
                  </svg>
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                <CountUp value={stat.value} />
                {stat.suffix && (
                  <span className="ml-1 text-base font-normal text-gray-400 dark:text-gray-500">
                    {stat.suffix}
                  </span>
                )}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {totalHoursStudied > 0 && (
        <Reveal delay={120} className="mt-4">
          <div className="group rounded-xl border border-gray-200 bg-white px-6 py-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {d.estimatedHours}
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  <CountUp value={totalHoursStudied} />
                  <span className="ml-1 text-base font-normal text-gray-400 dark:text-gray-500">
                    {d.hours}
                  </span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-emerald-400/20 to-emerald-600/20 ring-1 ring-emerald-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {recentActivity.length > 0 && (
        <Reveal delay={160} className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{d.recentCompletions}</h2>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {recentActivity.map((log, i) => (
              <Link
                key={i}
                href={`/dashboard/goals/${log.topic.phase.path.goal.id}`}
                className="group relative flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-accent/5"
              >
                <span className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-linear-to-b from-accent to-accent-3 transition-transform duration-300 group-hover:scale-y-100" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 transition-transform duration-300 group-hover:translate-x-1 dark:text-gray-100">{log.topic.title}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-400 transition-transform duration-300 group-hover:translate-x-1 dark:text-gray-500">{log.topic.phase.path.goal.title}</p>
                </div>
                <div className="ml-4 shrink-0 text-right">
                  <p className="text-xs text-gray-400 dark:text-gray-500">{log.topic.estimated_hrs}h</p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {log.completed_at ? new Date(log.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      {(activeGoals > 0 || completedTopics > 0) && (
        <Reveal delay={200} className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/dashboard/review" className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/10 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{d.weeklyReview}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{d.weeklyReviewDesc}</p>
            </div>
            <svg className="h-4 w-4 -translate-x-2 text-gray-300 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
          <Link href="/dashboard/chat" className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-500/10 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/10 ring-1 ring-purple-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{d.chatAssistant}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{d.chatAssistantDesc}</p>
            </div>
            <svg className="h-4 w-4 -translate-x-2 text-gray-300 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </Reveal>
      )}
    </div>
  );
}
