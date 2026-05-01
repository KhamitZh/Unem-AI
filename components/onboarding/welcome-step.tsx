"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles, TrendingUp, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AIOrb } from "@/components/ai-orb"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

export function WelcomeStep() {
  const { profile, setStep } = useApp()
  const locale = profile.locale

  const features = [
    { icon: Wallet, label: { kk: "Шығынды бақыла", ru: "Контроль трат", en: "Track spending" } },
    { icon: TrendingUp, label: { kk: "Мақсатқа жина", ru: "Копи на цели", en: "Reach goals" } },
    { icon: Sparkles, label: { kk: "Инвест-кеңес", ru: "Советы по инвестициям", en: "Smart investing" } },
  ] as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative mx-auto flex w-full max-w-xl flex-col items-center text-center"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.6, ease: "easeOut" }}
        className="mb-8"
      >
        <AIOrb size={108} />
      </motion.div>

      <h1 className="font-display text-balance text-5xl leading-[1.05] tracking-tight md:text-6xl">
        <span className="text-gradient">{t(locale, "welcomeTitle")}</span>
      </h1>
      <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
        {t(locale, "welcomeSub")}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {features.map(({ icon: Icon, label }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs text-foreground/80 backdrop-blur"
          >
            <Icon className="size-3.5 text-primary" />
            {label[locale]}
          </motion.div>
        ))}
      </div>

      <Button
        size="lg"
        onClick={() => setStep("theme")}
        className="mt-10 h-12 rounded-full px-7 text-base font-medium shadow-glow"
      >
        {t(locale, "getStarted")}
        <ArrowRight className="ml-2 size-4" />
      </Button>

      <p className="mt-6 text-xs text-muted-foreground">
        {t(locale, "poweredBy")}
      </p>
    </motion.div>
  )
}
