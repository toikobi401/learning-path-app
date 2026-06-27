"use client";

import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
};

/**
 * Animates a number from 0 → value the first time it scrolls into view.
 */
export function CountUp({ value, duration = 1500, decimals = 0, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        obs.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
          setDisplay(value * eased);
          if (p < 1) requestAnimationFrame(tick);
          else setDisplay(value);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
