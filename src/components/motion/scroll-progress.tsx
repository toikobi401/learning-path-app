"use client";

import { useEffect, useRef } from "react";

/**
 * Thin gradient bar pinned to the top that tracks scroll progress.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        el.style.transform = `scaleX(${p})`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left"
      style={{
        transform: "scaleX(0)",
        background: "linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3))",
      }}
    />
  );
}
