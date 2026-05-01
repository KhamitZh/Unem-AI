"use client"

import { motion } from "framer-motion"
import { Moon, Sun, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { StepHeader } from "./step-header"
import { StepFooter } from "./step-footer"

export function ThemeStep() {
  const { profile, setStep } = useApp()
  const locale = profile.locale
  const { theme, setTheme } = useTheme()

  const options = [
    {
      value: "dark" as const,
      icon: Moon,
      title: t(locale, "dark"),
      desc: t(locale, "darkDesc"),
      preview:
        "from-zinc-900 via-zinc-950 to-black border-white/10 text-zinc-100",
    },
    {
      value: "light" as const,
      icon: Sun,
      title: t(locale, "light"),
      desc: t(locale, "lightDesc"),
      preview:
        "from-amber-50 via-stone-50 to-white border-stone-200 text-stone-900",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-2xl"
    >
      <StepHeader
        title={t(locale, "themeTitle")}
        subtitle={t(locale, "themeSub")}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {options.map(({ value, icon: Icon, title, desc, preview }) => {
          const selected = theme === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-1 text-left transition-all",
                selected
                  ? "border-primary/60 ring-2 ring-primary/40 shadow-glow"
                  : "border-border hover:border-foreground/20",
              )}
            >
              <div
                className={cn(
                  "rounded-[calc(var(--radius)+2px)] bg-gradient-to-br p-5 sm:p-6",
                  preview,
                )}
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-5" />
                  <div
                    className={cn(
                      "grid size-6 place-items-center rounded-full transition-opacity",
                      selected
                        ? "bg-primary text-primary-foreground opacity-100"
                        : "opacity-0",
                    )}
                  >
                    <Check className="size-3.5" />
                  </div>
                </div>
                <div className="mt-12">
                  <div className="font-display text-2xl tracking-tight">
                    {title}
                  </div>
                  <div className="mt-1 text-sm opacity-80">{desc}</div>
                </div>
                {/* mini bar chart preview */}
                <div className="mt-6 flex items-end gap-1.5">
                  {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-current opacity-60"
                      style={{ height: `${h * 0.4}px` }}
                    />
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <StepFooter
        onBack={() => setStep("welcome")}
        onNext={() => setStep("auth")}
        nextDisabled={!theme}
        locale={locale}
      />
    </motion.div>
  )
}
