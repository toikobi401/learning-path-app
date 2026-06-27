"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay before the entrance animation, in ms. Useful for staggering. */
  delay?: number;
  variant?: "up" | "scale" | "left" | "right";
  /** Animate only the first time it enters the viewport. */
  once?: boolean;
};

/**
 * Scroll-reveal wrapper powered by IntersectionObserver.
 * Toggles the `is-visible` class (see globals.css `.reveal`).
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) obs.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [once]);

  const variantClass =
    variant === "scale"
      ? "reveal-scale"
      : variant === "left"
        ? "reveal-left"
        : variant === "right"
          ? "reveal-right"
          : "";

  return (
    <div
      ref={ref}
      className={`reveal ${variantClass} ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
