"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { StepHeader } from "./step-header"
import { StepFooter } from "./step-footer"
import type { IncomeBracket } from "@/lib/types"

const adultBrackets: { value: IncomeBracket; label: string }[] = [
  { value: "50k-200k", label: "50 000 — 200 000 ₸" },
  { value: "210k-350k", label: "210 000 — 350 000 ₸" },
  { value: "360k-500k", label: "360 000 — 500 000 ₸" },
  { value: "500k-1m", label: "500 000 — 1 000 000 ₸" },
  { value: "1m-plus", label: "1 000 000+ ₸" },
]

const studentBrackets: { value: IncomeBracket; labelKey?: string; label?: string }[] =
  [
    { value: "school-student", labelKey: "schoolStudent" },
    { value: "stipend-0-50k", label: "0 — 50 000 ₸" },
    { value: "stipend-50k-100k", label: "50 000 — 100 000 ₸" },
    { value: "stipend-other", label: "Other / Custom" },
  ]

export function IncomeStep() {
  const { profile, setIncome, setStep } = useApp()
  const locale = profile.locale
  const [custom, setCustom] = useState<string>(
    profile.customIncome?.toString() ?? "",
  )

  const isStudent = profile.ageGroup?.startsWith("student") ?? false
  const brackets = isStudent ? studentBrackets : adultBrackets

  const selected = profile.incomeBracket
  const customNum = Number(custom.replace(/\D/g, ""))
  const customValid =
    selected === "stipend-other" ? customNum > 0 : true
  const valid = !!selected && customValid

  function handleNext() {
    if (!selected) return
    setIncome(
      selected,
      selected === "stipend-other" && customNum > 0 ? customNum : null,
    )
    setStep("intro-expenses")
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
        title={t(locale, isStudent ? "incomeTitleStudent" : "incomeTitleAdult")}
        subtitle={t(locale, "incomeSub")}
      />

      <div className="mt-8 grid gap-2.5">
        {brackets.map((b) => {
          const isSel = selected === b.value
          const label = b.label ?? (b.labelKey ? t(locale, b.labelKey as any) : "")
          return (
            <button
              key={b.value}
              type="button"
              onClick={() => setIncome(b.value, null)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl border bg-card/60 px-5 py-4 text-left backdrop-blur transition-all",
                isSel
                  ? "border-primary/60 ring-2 ring-primary/30"
                  : "border-border hover:border-foreground/20",
              )}
            >
              <span className="font-medium tracking-tight">{label}</span>
              <div
                className={cn(
                  "grid size-6 place-items-center rounded-full transition-opacity",
                  isSel
                    ? "bg-primary text-primary-foreground opacity-100"
                    : "opacity-0",
                )}
              >
                <Check className="size-3.5" />
              </div>
            </button>
          )
        })}

        {selected === "stipend-other" ? (
          <div className="mt-2 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
            <Input
              inputMode="numeric"
              placeholder={t(locale, "customIncomePlaceholder")}
              value={custom}
              onChange={(e) =>
                setCustom(
                  e.target.value
                    .replace(/[^\d]/g, "")
                    .replace(/(\d)(?=(\d{3})+$)/g, "$1 "),
                )
              }
              className="h-12 text-base"
            />
          </div>
        ) : null}
      </div>

      <StepFooter
        onBack={() => setStep("age")}
        onNext={handleNext}
        nextDisabled={!valid}
        locale={locale}
      />
    </motion.div>
  )
}
