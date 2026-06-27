import Image from "next/image";

type LogoProps = {
  /** "full" = icon + wordmark, "mark" = icon only. */
  variant?: "full" | "mark";
  /** Control size via a height utility, e.g. "h-7". Width stays auto. */
  className?: string;
  priority?: boolean;
};

/**
 * PathAI brand logo. The source PNGs are monochrome on a transparent
 * background, so `dark:invert` flips the dark mark to light in dark mode.
 */
export function Logo({ variant = "full", className = "h-7", priority = false }: LogoProps) {
  const isFull = variant === "full";
  return (
    <Image
      src={isFull ? "/logos/pathai-full.png" : "/logos/pathai-mark.png"}
      alt="PathAI"
      width={isFull ? 880 : 256}
      height={isFull ? 480 : 242}
      priority={priority}
      className={`w-auto select-none dark:invert ${className}`}
    />
  );
}
