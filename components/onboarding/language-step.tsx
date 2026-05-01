"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { useApp } from "@/lib/store"
import { t, LOCALE_LABEL, LOCALE_FLAG } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { StepHeader } from "./step-header"
import { StepFooter } from "./step-footer"
import type { Locale } from "@/lib/types"

const ORDER: Locale[] = ["kk", "ru", "en"]

const NATIVE_HELLO: Record<Locale, string> = {
  kk: "Сәлем!",
  ru: "Привет!",
  en: "Hello!",
}

export function LanguageStep() {
  const { profile, setLocale, setStep } = useApp()
  const locale = profile.locale

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-2xl"
    >
      <StepHeader
        title={t(locale, "languageTitle")}
        subtitle={t(locale, "languageSub")}
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {ORDER.map((l) => {
          const selected = locale === l
          return (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card/60 p-5 text-left backdrop-blur transition-all",
                selected
                  ? "border-primary/60 ring-2 ring-primary/30 shadow-glow"
                  : "border-border hover:border-foreground/20",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md border border-border bg-background/60 px-2 py-0.5 font-mono text-[11px] tracking-wider text-muted-foreground">
                  {LOCALE_FLAG[l]}
                </span>
                {selected && (
                  <div className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" />
                  </div>
                )}
              </div>
              <div className="mt-8">
                <div className="font-display text-2xl tracking-tight">
                  {NATIVE_HELLO[l]}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {LOCALE_LABEL[l]}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <StepFooter
        onBack={() => setStep("auth")}
        onNext={() => setStep("age")}
        locale={locale}
      />
    </motion.div>
  )
}
