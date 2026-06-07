import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      {/* Nav */}
      <header className="border-b border-gray-100 px-8 py-5 dark:border-gray-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            PathAI
          </span>
          <nav className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="ml-2 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="mx-auto w-full max-w-6xl px-8 py-28">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
              AI-powered learning
            </p>
            <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
              Build the skills you need,
              <br />
              on a schedule that fits.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
              Describe your goal. PathAI generates a structured, week-by-week
              curriculum — then adjusts automatically as you make progress.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/register"
                className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
              >
                Start for free
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Already have an account →
              </Link>
            </div>
          </div>
        </section>

        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-8 py-20">
          <div className="grid gap-px border border-gray-100 bg-gray-100 sm:grid-cols-3 dark:border-gray-800 dark:bg-gray-800">
            <div className="bg-white px-8 py-10 dark:bg-gray-950">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                01
              </p>
              <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
                Goal-driven paths
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Enter your target — a programming language, a framework, a
                certification. The AI structures a realistic timeline based on
                your available hours per day.
              </p>
            </div>

            <div className="bg-white px-8 py-10 dark:bg-gray-950">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                02
              </p>
              <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
                Adaptive weekly reviews
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Log your study sessions daily. Every week, the AI analyses your
                pace and rebalances upcoming topics so the plan stays achievable.
              </p>
            </div>

            <div className="bg-white px-8 py-10 dark:bg-gray-950">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                03
              </p>
              <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
                Contextual chat assistant
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Ask questions at any point. The assistant is aware of your
                curriculum and current week — answers are specific to where
                you are, not generic.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-6xl px-8 py-20 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Ready to build your learning path?
            </h2>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Free to start. No credit card required.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-block rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
            >
              Create your path
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-8 py-5 dark:border-gray-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">PathAI</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Built with Next.js &amp; Claude API
          </span>
        </div>
      </footer>
    </div>
  );
}
