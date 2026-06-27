"use client";

import { useEffect } from "react";

/**
 * Publishes the cursor position as `--cursor-x` / `--cursor-y` (viewport px)
 * on the root <html> element, so any background layer — even server-rendered
 * ones — can react to the mouse purely through CSS (glow, dot-reveal, etc.).
 * Renders nothing.
 */
export function CursorField() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const root = document.documentElement;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        root.style.setProperty("--cursor-x", `${e.clientX}px`);
        root.style.setProperty("--cursor-y", `${e.clientY}px`);
        root.style.setProperty("--cursor-active", "1");
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
