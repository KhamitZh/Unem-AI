"use client"

import { cn } from "@/lib/utils"

interface AIOrbProps {
  size?: number
  className?: string
  active?: boolean
}

/**
 * Animated AI brand orb. Pure CSS — performant and theme-aware.
 * Glowing emerald core with rotating amber/teal halo.
 */
export function AIOrb({ size = 56, className, active = true }: AIOrbProps) {
  const px = `${size}px`
  return (
    <div
      className={cn(
        "relative shrink-0 grid place-items-center",
        className,
      )}
      style={{ width: px, height: px }}
      aria-hidden="true"
    >
      {/* Outer rotating halo */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-md opacity-80",
          active && "animate-orbit-slow",
        )}
        style={{
          background:
            "conic-gradient(from 0deg, var(--primary), var(--accent), var(--primary))",
        }}
      />
      {/* Inner core */}
      <div
        className="absolute inset-[18%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--primary) 90%, white) 0%, var(--primary) 45%, color-mix(in oklab, var(--primary) 50%, black) 100%)",
          boxShadow:
            "0 0 0 1px color-mix(in oklab, var(--primary) 30%, transparent), 0 8px 30px -6px color-mix(in oklab, var(--primary) 60%, transparent)",
        }}
      />
      {/* Inner highlight ring */}
      <div
        className={cn(
          "absolute inset-[10%] rounded-full border border-white/10",
          active && "animate-pulse-soft",
        )}
      />
      {/* Specular */}
      <div
        className="absolute rounded-full bg-white/40 blur-[2px]"
        style={{
          width: size * 0.18,
          height: size * 0.12,
          top: size * 0.22,
          left: size * 0.28,
        }}
      />
    </div>
  )
}

export function AIWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <AIOrb size={28} />
      <span className="font-display text-[1.35rem] leading-none tracking-tight">
        ҮнемАІ
      </span>
    </div>
  )
}
