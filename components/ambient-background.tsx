"use client"

/**
 * Soft ambient background used behind onboarding screens.
 * Two slow-floating emerald/amber blobs + subtle grid.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div
        className="absolute -top-32 -left-32 size-[42rem] rounded-full blur-3xl opacity-40 animate-pulse-soft"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--primary) 70%, transparent), transparent 65%)",
        }}
      />
      <div
        className="absolute -bottom-40 -right-32 size-[38rem] rounded-full blur-3xl opacity-30 animate-pulse-soft"
        style={{
          animationDelay: "1.4s",
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--accent) 60%, transparent), transparent 65%)",
        }}
      />
    </div>
  )
}
