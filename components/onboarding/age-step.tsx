"use client"

import { motion } from "framer-motion"
import { Check, GraduationCap, BookOpen, Briefcase, Building2, UserRound } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { StepHeader } from "./step-header"
import { StepFooter } from "./step-footer"
import type { AgeGroup } from "@/lib/types"

export function AgeStep() {
  const { profile, setAge, setStep } = useApp()
  const locale = profile.locale

  const groups: { value: AgeGroup; key: keyof typeof labels; icon: typeof GraduationCap }[] = [
    { value: "student-5-14", key: "ageStudent514", icon: BookOpen },
    { value: "student-15-20", key: "ageStudent1520", icon: GraduationCap },
    { value: "adult-21-25", key: "ageAdult2125", icon: UserRound },
    { value: "adult-26-37", key: "ageAdult2637", icon: Briefcase },
    { value: "adult-38-plus", key: "ageAdult38", icon: Building2 },
  ]
  const labels = {
    ageStudent514: 1,
    ageStudent1520: 1,
    ageAdult2125: 1,
    ageAdult2637: 1,
    ageAdult38: 1,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-2xl"
    >
      <StepHeader
        title={t(locale, "ageTitle")}
        subtitle={t(locale, "ageSub")}
      />

      <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
        {groups.map(({ value, key, icon: Icon }) => {
          const selected = profile.ageGroup === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setAge(value)}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border bg-card/60 p-4 text-left backdrop-blur transition-all",
                selected
                  ? "border-primary/60 ring-2 ring-primary/30"
                  : "border-border hover:border-foreground/20",
              )}
            >
              <div
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl border border-border transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/60 text-foreground",
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium tracking-tight">
                  {t(locale, key)}
                </div>
              </div>
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
            </button>
          )
        })}
      </div>

      <StepFooter
        onBack={() => setStep("language")}
        onNext={() => setStep("income")}
        nextDisabled={!profile.ageGroup}
        locale={locale}
      />
    </motion.div>
  )
}
