"use client";

import Link from "next/link";
import { useRef, type ReactNode, type MouseEvent } from "react";

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
  /** How strongly the element follows the cursor (0–1). */
  strength?: number;
  /** Material-style ripple on press. */
  ripple?: boolean;
  disabled?: boolean;
};

/**
 * A button or link that is magnetically attracted to the cursor and
 * emits a ripple on press. Renders <Link> when `href` is provided.
 */
export function MagneticButton({
  children,
  href,
  type = "button",
  onClick,
  className = "",
  strength = 0.35,
  ripple = true,
  disabled = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const rafRef = useRef(0);

  const handleMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    el.style.transform = "translate(0px, 0px)";
  };

  const handleDown = (e: MouseEvent) => {
    if (!ripple) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ink = document.createElement("span");
    ink.className = "ripple-ink";
    ink.style.width = ink.style.height = `${size}px`;
    ink.style.left = `${e.clientX - rect.left - size / 2}px`;
    ink.style.top = `${e.clientY - rect.top - size / 2}px`;
    el.appendChild(ink);
    window.setTimeout(() => ink.remove(), 650);
  };

  const cls = `relative inline-flex items-center justify-center overflow-hidden transition-transform duration-300 ease-out will-change-transform ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={cls}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onMouseDown={handleDown}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      className={cls}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onMouseDown={handleDown}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
