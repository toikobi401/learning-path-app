import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { SiteBackground } from "@/components/motion/site-background";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen bg-background">
      <SiteBackground variant="full" />

      {/* Left panel — brand */}
      <div className="relative hidden w-104 shrink-0 flex-col justify-between overflow-hidden border-r border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface)_45%,transparent)] px-12 py-10 backdrop-blur-sm lg:flex">
        <Link href="/" className="relative inline-block transition-transform duration-300 hover:scale-105">
          <Logo variant="full" priority className="h-8" />
        </Link>

        <div className="relative animate-fade-up">
          <blockquote className="text-2xl font-semibold leading-snug tracking-tight">
            &ldquo;An investment in knowledge pays the{" "}
            <span className="text-gradient">best interest</span>.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">— Benjamin Franklin</p>
        </div>

        <p className="relative text-xs text-gray-400 dark:text-gray-500">
          AI-powered learning paths, built around your schedule.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Toggle top-right */}
        <div className="absolute right-6 top-5">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm animate-fade-up rounded-2xl border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface)_55%,transparent)] p-7 shadow-2xl shadow-accent/5 backdrop-blur-xl sm:p-8">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 inline-block lg:hidden">
            <Logo variant="full" className="h-7" />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
