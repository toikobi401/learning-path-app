import { Aurora } from "./aurora";
import { Particles } from "./particles";
import { CursorField } from "./cursor-field";

type SiteBackgroundProps = {
  /** "full" = marketing/auth surfaces, "subtle" = app/dashboard surfaces. */
  variant?: "full" | "subtle";
};

// Mask that reveals a soft circle around the cursor (off-screen until the
// pointer moves, thanks to the fallback values).
const REVEAL_MASK =
  "radial-gradient(220px circle at var(--cursor-x, -300px) var(--cursor-y, -300px), #000 0%, rgba(0,0,0,0.4) 45%, transparent 70%)";

/**
 * Layered ambient background, fixed to the viewport and painted behind
 * content (-z-10).
 *
 * Layers (back → front): base tint · aurora mesh · rotating conic beam ·
 * dim dot grid · cursor-revealed bright dots · cursor glow · particles · grain.
 */
export function SiteBackground({ variant = "full" }: SiteBackgroundProps) {
  const full = variant === "full";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <CursorField />

      {/* base tint from the top */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 110% at 50% -10%, color-mix(in srgb, var(--accent) 7%, transparent), transparent 55%)",
        }}
      />

      {/* aurora mesh */}
      <Aurora className={`absolute inset-0 ${full ? "" : "opacity-45"}`} />

      {/* rotating conic beam */}
      {full && (
        <div
          className="animate-spin-slow absolute -top-[28%] left-1/2 h-[60rem] w-[60rem] -translate-x-1/2 rounded-full opacity-25 blur-2xl"
          style={{
            background:
              "conic-gradient(from 90deg, transparent, var(--accent), transparent 25%, var(--accent-3), transparent 55%, var(--accent-2), transparent 85%)",
            maskImage: "radial-gradient(closest-side, #000 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(closest-side, #000 30%, transparent 75%)",
          }}
        />
      )}

      {/* dim dot grid, fading toward the bottom */}
      <div
        className={`bg-dots absolute inset-0 ${full ? "opacity-100" : "opacity-50"}`}
        style={{
          maskImage: "radial-gradient(95% 70% at 50% 0%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(95% 70% at 50% 0%, #000 30%, transparent 100%)",
        }}
      />

      {/* bright dots revealed around the cursor (spotlight reveal) */}
      <div
        className="bg-dots-bright absolute inset-0"
        style={{ maskImage: REVEAL_MASK, WebkitMaskImage: REVEAL_MASK }}
      />

      {/* cursor glow */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: full ? 1 : 0.6,
          background:
            "radial-gradient(600px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), var(--glow-1), transparent 60%)",
        }}
      />

      {/* drifting particles */}
      {full && <Particles />}

      {/* film grain */}
      <div className="grain absolute inset-0" />
    </div>
  );
}
