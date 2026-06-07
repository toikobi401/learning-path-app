import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen dark:bg-gray-950">
      {/* Left panel — brand */}
      <div className="hidden w-105 shrink-0 flex-col justify-between border-r border-gray-100 bg-gray-50 px-12 py-10 lg:flex dark:border-gray-800 dark:bg-gray-900">
        <Link href="/" className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          PathAI
        </Link>

        <div>
          <blockquote className="text-2xl font-semibold leading-snug tracking-tight text-gray-900 dark:text-gray-100">
            &ldquo;An investment in knowledge pays the best interest.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">— Benjamin Franklin</p>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          AI-powered learning paths, built around your schedule.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-white dark:bg-gray-950">
        {/* Toggle top-right */}
        <div className="absolute top-5 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link
            href="/"
            className="mb-8 block text-sm font-semibold tracking-tight text-gray-900 lg:hidden dark:text-gray-100"
          >
            PathAI
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
