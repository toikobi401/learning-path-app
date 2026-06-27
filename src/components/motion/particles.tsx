/**
 * Subtle drifting "dust motes". Purely presentational, deterministic
 * positions (no Math.random) to stay hydration-safe.
 */
const PARTICLES = [
  { left: "6%", top: "82%", size: 5, dur: 17, delay: 0 },
  { left: "14%", top: "40%", size: 3, dur: 22, delay: 3 },
  { left: "22%", top: "68%", size: 6, dur: 19, delay: 6 },
  { left: "31%", top: "24%", size: 4, dur: 24, delay: 1 },
  { left: "39%", top: "88%", size: 3, dur: 20, delay: 8 },
  { left: "47%", top: "52%", size: 7, dur: 26, delay: 4 },
  { left: "55%", top: "30%", size: 4, dur: 18, delay: 10 },
  { left: "63%", top: "76%", size: 5, dur: 23, delay: 2 },
  { left: "71%", top: "44%", size: 3, dur: 21, delay: 7 },
  { left: "79%", top: "64%", size: 6, dur: 25, delay: 5 },
  { left: "86%", top: "34%", size: 4, dur: 19, delay: 9 },
  { left: "92%", top: "72%", size: 5, dur: 27, delay: 3 },
];

export function Particles({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-accent blur-[1px]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animation: `particle-drift ${p.dur}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
