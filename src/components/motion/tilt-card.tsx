"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees. */
  max?: number;
};

/**
 * 3D tilt + local cursor spotlight on hover.
 * Pairs with the `.spotlight-card` utility (radial glow follows --mx/--my).
 */
export function TiltCard({ children, className = "", max = 8 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${
        (px - 0.5) * max
      }deg)`;
    });
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`spotlight-card transition-transform duration-300 ease-out ${className}`}
    >
      {children}
    </div>
  );
}
