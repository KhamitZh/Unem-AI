"use client"

interface StepHeaderProps {
  title: string
  subtitle?: string
  eyebrow?: string
}

export function StepHeader({ title, subtitle, eyebrow }: StepHeaderProps) {
  return (
    <div className="text-center">
      {eyebrow ? (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span className="size-1.5 rounded-full bg-primary" />
          {eyebrow}
        </div>
      ) : null}
      <h2 className="font-display text-balance text-3xl leading-tight tracking-tight md:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
