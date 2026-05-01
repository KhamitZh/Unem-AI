"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useApp } from "@/lib/store"
import { AmbientBackground } from "@/components/ambient-background"
import { AIWordmark } from "@/components/ai-orb"
import { WelcomeStep } from "./welcome-step"
import { ThemeStep } from "./theme-step"
import { AuthStep } from "./auth-step"
import { LanguageStep } from "./language-step"
import { AgeStep } from "./age-step"
import { IncomeStep } from "./income-step"
import { IntroChatStep } from "./intro-chat-step"

const ORDER = [
  "welcome",
  "theme",
  "auth",
  "language",
  "age",
  "income",
  "intro-expenses",
  "intro-goals",
] as const

export function OnboardingFlow() {
  const { step } = useApp()

  const idx = ORDER.indexOf(step as (typeof ORDER)[number])
  const progress =
    idx >= 0 ? ((idx + 1) / ORDER.length) * 100 : 0

  return (
    <main className="relative flex min-h-dvh flex-col">
      <AmbientBackground />

      <header className="flex items-center justify-between px-4 py-5 md:px-8">
        <AIWordmark />
        <div className="hidden items-center gap-3 sm:flex">
          <div className="h-1 w-40 overflow-hidden rounded-full bg-muted/60">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {Math.max(idx + 1, 1)} / {ORDER.length}
          </span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-8 md:py-16">
        <AnimatePresence mode="wait">
          <div key={step} className="w-full">
            {step === "welcome" && <WelcomeStep />}
            {step === "theme" && <ThemeStep />}
            {step === "auth" && <AuthStep />}
            {step === "language" && <LanguageStep />}
            {step === "age" && <AgeStep />}
            {step === "income" && <IncomeStep />}
            {step === "intro-expenses" && <IntroChatStep variant="expenses" />}
            {step === "intro-goals" && <IntroChatStep variant="goals" />}
          </div>
        </AnimatePresence>
      </div>
    </main>
  )
}
