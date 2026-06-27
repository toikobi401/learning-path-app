import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { Aurora } from "@/components/motion/aurora";
import { SiteBackground } from "@/components/motion/site-background";
import { Reveal } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { ScrollProgress } from "@/components/motion/scroll-progress";

const FEATURES = [
  {
    n: "01",
    title: "Goal-driven paths",
    body: "Enter your target — a language, a framework, a certification. The AI structures a realistic timeline around your available hours per day.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    ),
  },
  {
    n: "02",
    title: "Adaptive weekly reviews",
    body: "Log study sessions daily. Every week the AI analyses your pace and rebalances upcoming topics so the plan stays achievable.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    ),
  },
  {
    n: "03",
    title: "Contextual chat assistant",
    body: "Ask questions any time. The assistant knows your curriculum and current week — answers are specific to where you are, not generic.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    ),
  },
];

const STEPS = [
  { step: "Describe", text: "Tell PathAI your goal and how many hours a week you can commit." },
  { step: "Generate", text: "Get a structured, phase-by-phase curriculum in seconds." },
  { step: "Adapt", text: "Check in as you learn — the plan rebalances to keep you on track." },
];

export default function HomePage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-background">
      <ScrollProgress />
      <SiteBackground variant="full" />

      {/* Nav */}
      <header className="sticky top-0 z-40">
        <div className="glass border-b border-[color-mix(in_srgb,var(--border)_60%,transparent)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 sm:px-8">
            <Link href="/" className="flex items-center transition-transform duration-300 hover:scale-105">
              <Logo variant="full" priority className="h-7" />
            </Link>
            <nav className="flex items-center gap-1">
              <ThemeToggle />
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/70 dark:hover:text-gray-100"
              >
                Sign in
              </Link>
              <MagneticButton
                href="/register"
                strength={0.4}
                className="ml-2 rounded-md bg-linear-to-r from-accent to-accent-2 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-accent/25 hover:shadow-accent/40"
              >
                Get started
              </MagneticButton>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <div className="max-w-2xl">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] px-3 py-1 text-xs font-medium text-gray-600 backdrop-blur dark:text-gray-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                AI-powered learning
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Build the skills
                <br />
                you need, on a{" "}
                <span className="text-gradient">schedule that fits</span>.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
                Describe your goal. PathAI generates a structured, week-by-week
                curriculum — then adjusts automatically as you make progress.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <MagneticButton
                  href="/register"
                  strength={0.45}
                  className="group gap-2 rounded-lg bg-linear-to-r from-accent to-accent-2 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-accent/30 hover:shadow-accent/50"
                >
                  Start for free
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </MagneticButton>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Already have an account →
                </Link>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="mt-10 flex items-center gap-6 text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Free to start
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  No credit card
                </span>
              </div>
            </Reveal>
          </div>

          {/* Floating product preview + illustration */}
          <Reveal variant="scale" delay={200} className="hidden lg:block">
            <div className="relative">
              {/* glow halo */}
              <div aria-hidden className="absolute -inset-6 rounded-[3rem] bg-accent/15 blur-3xl" />
              {/* rotating dashed orbit ring */}
              <div aria-hidden className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin-slow h-[24rem] w-[24rem] rounded-full border border-dashed border-accent/25" />
                <div className="animate-spin-slow absolute h-[30rem] w-[30rem] rounded-full border border-dashed border-accent/10 [animation-direction:reverse] [animation-duration:34s]" />
              </div>
              {/* floating skill chips */}
              <span className="animate-float absolute -left-5 top-10 z-20 flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur [animation-delay:-1s]">
                ⚛️ React
              </span>
              <span className="animate-float absolute -right-6 top-1/3 z-20 flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur [animation-delay:-3.5s]">
                🐍 Python
              </span>
              <span className="animate-float absolute -left-3 bottom-10 z-20 flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur [animation-delay:-6s]">
                📘 TypeScript
              </span>
              <div className="relative animate-float">
              <TiltCard max={10} className="rounded-2xl">
                <div className="relative rounded-2xl border border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] p-5 shadow-2xl shadow-accent/10 backdrop-blur-xl">
                  {/* window dots */}
                  <div className="mb-4 flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                    <span className="ml-3 text-xs font-medium text-gray-400">Your learning path</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">JavaScript Mastery</p>
                      <p className="text-xs text-gray-400">Week 3 of 12</p>
                    </div>
                    <span className="rounded-full bg-linear-to-r from-accent to-accent-3 px-2.5 py-1 text-[11px] font-semibold text-white">
                      🔥 7-day streak
                    </span>
                  </div>

                  {/* progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>Progress</span>
                      <span>32%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200/70 dark:bg-gray-700/50">
                      <div className="h-full w-[32%] rounded-full bg-linear-to-r from-accent via-accent-2 to-accent-3" />
                    </div>
                  </div>

                  {/* phases */}
                  <div className="mt-5 space-y-2.5">
                    {[
                      { t: "Fundamentals & syntax", done: true },
                      { t: "Functions & scope", done: true },
                      { t: "Async & promises", done: false, active: true },
                      { t: "DOM & events", done: false },
                    ].map((p) => (
                      <div key={p.t} className="flex items-center gap-3 rounded-lg border border-[color-mix(in_srgb,var(--border)_60%,transparent)] bg-background/40 px-3 py-2">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                            p.done ? "bg-emerald-500" : p.active ? "bg-accent" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          {p.done ? (
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          ) : p.active ? (
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                            </span>
                          ) : null}
                        </span>
                        <span className={`text-xs ${p.active ? "font-semibold" : "text-gray-500 dark:text-gray-400"}`}>{p.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TiltCard>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Stats strip */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-8 sm:px-8">
          <Reveal>
            <div className="grid grid-cols-3 divide-x divide-[color-mix(in_srgb,var(--border)_70%,transparent)] rounded-2xl border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface)_50%,transparent)] py-6 backdrop-blur">
              {[
                { k: "10k+", v: "paths generated" },
                { k: "92%", v: "stay on schedule" },
                { k: "24/7", v: "AI assistant" },
              ].map((s) => (
                <div key={s.v} className="px-4 text-center">
                  <p className="text-2xl font-bold tracking-tight sm:text-3xl">
                    <span className="text-gradient">{s.k}</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">{s.v}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-8">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to <span className="text-gradient">stay on track</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-gray-500 dark:text-gray-400">
              A learning system that adapts to you — not the other way around.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.n} delay={i * 120} variant="up">
                <TiltCard className="h-full rounded-2xl">
                  <div className="border-glow group relative h-full overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color-mix(in_srgb,var(--surface)_60%,transparent)] p-7 backdrop-blur transition-shadow duration-300 hover:shadow-2xl hover:shadow-accent/10">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-accent/15 to-accent-3/15 text-accent ring-1 ring-accent/20 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                          {f.icon}
                        </svg>
                      </span>
                      <span className="bg-linear-to-br from-accent to-accent-3 bg-clip-text text-3xl font-bold text-transparent opacity-30">
                        {f.n}
                      </span>
                    </div>
                    <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.body}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8">
          <Reveal>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-accent">How it works</p>
            <h2 className="mt-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">Three steps to your plan</h2>
          </Reveal>
          <div className="relative mt-14 grid gap-8 sm:grid-cols-3">
            {/* connecting line */}
            <div aria-hidden className="absolute left-0 right-0 top-7 hidden h-px bg-linear-to-r from-transparent via-accent/40 to-transparent sm:block" />
            {STEPS.map((s, i) => (
              <Reveal key={s.step} delay={i * 140} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-background text-lg font-bold shadow-lg shadow-accent/10">
                  <span className="text-gradient">{i + 1}</span>
                </div>
                <h3 className="mt-5 text-base font-semibold">{s.step}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-8">
          <Reveal variant="scale">
            <div className="relative overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-linear-to-br from-accent/10 via-accent-2/10 to-accent-3/10 px-8 py-16 text-center backdrop-blur">
              <Aurora className="absolute inset-0 opacity-70" />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to build your <span className="text-gradient">learning path</span>?
                </h2>
                <p className="mx-auto mt-4 max-w-md text-gray-500 dark:text-gray-400">
                  Free to start. No credit card required. Your first curriculum is minutes away.
                </p>
                <MagneticButton
                  href="/register"
                  strength={0.4}
                  className="mt-9 gap-2 rounded-lg bg-linear-to-r from-accent to-accent-2 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-accent/30 hover:shadow-accent/50"
                >
                  Create your path
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </MagneticButton>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[color-mix(in_srgb,var(--border)_60%,transparent)] px-6 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo variant="full" className="h-5 opacity-60" />
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Built with Next.js &amp; Claude API
          </span>
        </div>
      </footer>
    </div>
  );
}
