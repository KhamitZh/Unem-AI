"use client"

import { TrendingDown, TrendingUp, Target, Wallet } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

function fmt(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

export function ProfileCard() {
  const { profile, expenses, goals } = useApp()
  const locale = profile.locale

  const income = profile.estimatedIncome ?? 0
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const savingsPerMonth = Math.max(income - totalExpenses, 0)
  const savingsRate = income > 0 ? Math.round((savingsPerMonth / income) * 100) : 0

  const topGoal = goals[0]
  const monthsToGoal =
    topGoal && savingsPerMonth > 0
      ? Math.ceil(topGoal.price / savingsPerMonth)
      : null

  const stats = [
    {
      label: t(locale, "monthlyIncome"),
      value: fmt(income),
      icon: TrendingUp,
      tone: "text-primary",
    },
    {
      label: t(locale, "monthlyExpenses"),
      value: fmt(totalExpenses),
      icon: TrendingDown,
      tone: "text-foreground/80",
    },
    {
      label: t(locale, "savingsRate"),
      value: income > 0 ? `${savingsRate}%` : "—",
      icon: Wallet,
      tone:
        savingsRate >= 20
          ? "text-primary"
          : savingsRate >= 10
            ? "text-accent-foreground"
            : "text-foreground/80",
    },
  ]

  return (
    <div className="rounded-2xl border border-sidebar-border bg-sidebar/60 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary font-semibold">
          {(profile.name?.[0] ?? "?").toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate font-medium">{profile.name ?? "—"}</div>
          <div className="truncate text-xs text-muted-foreground">
            {profile.email ?? ""}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {stats.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-sidebar-border bg-background/40 p-2.5"
          >
            <s.icon className={cn("size-3.5", s.tone)} />
            <div className="mt-2 font-mono text-sm tabular-nums">{s.value}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {topGoal && (
        <div className="mt-3 rounded-xl border border-sidebar-border bg-background/40 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="size-3.5 text-accent" />
            {t(locale, "goal")}
          </div>
          <div className="mt-1 truncate font-medium">{topGoal.title}</div>
          <div className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
            {fmt(topGoal.price)}
          </div>
          {monthsToGoal !== null && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{t(locale, "goalProgress")}</span>
                <span className="font-mono tabular-nums">
                  ≈ {monthsToGoal} {t(locale, "months")}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  style={{
                    width: `${Math.min(
                      (savingsPerMonth / Math.max(topGoal.price / 12, 1)) * 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
