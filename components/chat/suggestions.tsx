"use client"

import { motion } from "framer-motion"
import { Sparkles, Target, TrendingDown, DollarSign } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

interface SuggestionsProps {
  onPick: (text: string) => void
}

export function Suggestions({ onPick }: SuggestionsProps) {
  const { profile } = useApp()
  const locale = profile.locale

  const items = [
    { key: "suggest1", icon: Target },
    { key: "suggest2", icon: TrendingDown },
    { key: "suggest3", icon: Sparkles },
    { key: "suggest4", icon: DollarSign },
  ] as const

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2">
      {items.map(({ key, icon: Icon }, i) => {
        const text = t(locale, key as any)
        return (
          <motion.button
            key={key}
            type="button"
            onClick={() => onPick(text)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3.5 text-left text-sm transition-all hover:border-primary/40 hover:bg-card/90"
          >
            <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-primary group-hover:bg-primary/10">
              <Icon className="size-4" />
            </div>
            <span className="text-pretty leading-snug">{text}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
