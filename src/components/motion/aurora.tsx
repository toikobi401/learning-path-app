/**
 * Decorative animated gradient mesh (blurred color blobs). Purely
 * presentational (no client JS). Place inside a `relative`/`isolate`
 * parent and give it `absolute inset-0`.
 */
export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none overflow-hidden ${className}`}>
      <div
        className="animate-aurora absolute -left-[10%] -top-[12%] h-[44rem] w-[44rem] rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--glow-1), transparent 60%)" }}
      />
      <div
        className="animate-aurora absolute -right-[12%] top-[6%] h-[36rem] w-[36rem] rounded-full opacity-60 blur-3xl [animation-delay:-5s]"
        style={{ background: "radial-gradient(circle, var(--glow-2), transparent 60%)" }}
      />
      <div
        className="animate-aurora absolute -bottom-[18%] left-[18%] h-[40rem] w-[40rem] rounded-full opacity-60 blur-3xl [animation-delay:-11s]"
        style={{ background: "radial-gradient(circle, var(--glow-3), transparent 60%)" }}
      />
      <div
        className="animate-aurora absolute bottom-[2%] right-[14%] h-[30rem] w-[30rem] rounded-full opacity-50 blur-3xl [animation-delay:-15s]"
        style={{ background: "radial-gradient(circle, var(--glow-1), transparent 60%)" }}
      />
    </div>
  );
}
