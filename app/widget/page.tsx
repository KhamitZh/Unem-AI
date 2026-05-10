"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Target, Wallet } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

function fmt(n: number): string {
  if (!n || n <= 0) return "0 ₸"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

export default function WidgetPage() {
  const { profile, expenses, goals } = useApp()
  const locale = profile.locale
  const [finances, setFinances] = useState<any[]>([])
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    fetch("/api/finances")
      .then((r) => r.json())
      .then((d) => setFinances(d.finances ?? []))

    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const incomes = finances.filter((f) => f.type === "income")
  const expensesList = finances.filter((f) => f.type === "expense")
  const goalsList = finances.filter((f) => f.type === "goal")

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expensesList.reduce((s, e) => s + e.amount, 0)
  const savings = Math.max(totalIncome - totalExpenses, 0)
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0

  const topGoal = goalsList[0]
  const monthsToGoal = topGoal && savings > 0 ? Math.ceil(topGoal.amount / savings) : null
  const progress = topGoal && savings > 0
    ? Math.min((savings / Math.max(topGoal.amount / 12, 1)) * 100, 100)
    : 0

  const greeting = time.getHours() < 12
    ? (locale === "kk" ? "Қайырлы таң" : locale === "ru" ? "Доброе утро" : "Good morning")
    : time.getHours() < 18
    ? (locale === "kk" ? "Қайырлы күн" : locale === "ru" ? "Добрый день" : "Good afternoon")
    : (locale === "kk" ? "Қайырлы кеш" : locale === "ru" ? "Добрый вечер" : "Good evening")

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{greeting},</p>
          <p className="font-bold text-lg">{profile.name ?? "—"}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold">
            {time.toLocaleTimeString(locale === "kk" ? "kk-KZ" : locale === "ru" ? "ru-RU" : "en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs text-muted-foreground">
            {time.toLocaleDateString(locale === "kk" ? "kk-KZ" : locale === "ru" ? "ru-RU" : "en-US", { weekday: "long" })}
          </p>
        </div>
      </div>

      {/* Жинақ */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-purple-600 p-5 text-white">
        <p className="text-xs opacity-80 mb-1">{t(locale, "savingsWord")}</p>
        <p className="text-3xl font-bold font-mono">{fmt(savings)}</p>
        <p className="text-xs opacity-70 mt-1">{savingsRate}% {t(locale, "savingsRate").toLowerCase()}</p>
      </div>

      {/* Кіріс / Шығыс */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-4 text-primary" />
            <span className="text-xs text-muted-foreground">{t(locale, "income")}</span>
          </div>
          <p className="font-mono font-bold">{fmt(totalIncome)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="size-4 text-foreground/70" />
            <span className="text-xs text-muted-foreground">{t(locale, "expenses")}</span>
          </div>
          <p className="font-mono font-bold">{fmt(totalExpenses)}</p>
        </div>
      </div>

      {/* Мақсат */}
      {topGoal && (
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-accent" />
              <span className="text-xs text-muted-foreground">{t(locale, "goals")}</span>
            </div>
            {monthsToGoal && (
              <span className="text-xs font-mono text-primary">≈ {monthsToGoal} {t(locale, "months")}</span>
            )}
          </div>
          <p className="font-medium text-sm truncate mb-2">{topGoal.title}</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{fmt(savings)} / {t(locale, "months")}</span>
            <span className="text-[10px] text-muted-foreground">{fmt(topGoal.amount)}</span>
          </div>
        </div>
      )}

      {/* Unem AI сілтемесі */}
      <a
        href="/"
        className="rounded-2xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-center gap-2 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
      >
        <Wallet className="size-4" />
        Unem AI →
      </a>
    </div>
  )
}
