"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Target } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"
import { useSubscription } from "@/lib/use-subscription"
import { UpgradeModal } from "@/components/subscription/upgrade-modal"

const CURRENCIES = [
  { code: "KZT", symbol: "₸" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "RUB", symbol: "₽" },
  { code: "CNY", symbol: "¥" },
  { code: "GBP", symbol: "£" },
  { code: "AED", symbol: "د.إ" },
  { code: "TRY", symbol: "₺" },
  { code: "KGS", symbol: "с" },
  { code: "UZS", symbol: "so'm" },
]

const toKZT: Record<string, number> = {
  KZT: 1, USD: 510, EUR: 550, RUB: 5.5,
  CNY: 70, GBP: 640, AED: 139, TRY: 16,
  KGS: 5.7, UZS: 0.04,
}

function fmt(n: number): string {
  if (!n || n <= 0) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

export default function GoalsPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const { isPro } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [goals, setGoals] = useState<any[]>([])
  const [incomes, setIncomes] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("KZT")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/finances")
      .then((r) => r.json())
      .then((d) => {
        const all = d.finances ?? []
        setGoals(all.filter((f: any) => f.type === "goal"))
        setIncomes(all.filter((f: any) => f.type === "income"))
        setExpenses(all.filter((f: any) => f.type === "expense"))
        setLoading(false)
      })
  }, [])

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const savings = Math.max(totalIncome - totalExpenses, 0)

  async function handleAdd() {
    if (goals.length >= 1 && !isPro) {
      setShowUpgrade(true)
      return
    }
    if (!title.trim() || !amount) return
    setSaving(true)
    const priceKZT = Math.round(Number(amount) * (toKZT[currency] ?? 1))
    const res = await fetch("/api/finances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "goal", title: title.trim(), amount: priceKZT, currency, period_days: 30 }),
    })
    const data = await res.json()
    setGoals((prev) => [data.finance, ...prev])
    setTitle("")
    setAmount("")
    setCurrency("KZT")
    setShowAdd(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/finances?id=${id}`, { method: "DELETE" })
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  function monthsToGoal(price: number): number | null {
    if (savings <= 0) return null
    return Math.ceil(price / savings)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <Target className="size-5 text-accent" />
          <h1 className="text-lg font-semibold">{t(locale, "goals")}</h1>
        </div>
        <div className="ml-auto font-mono text-sm text-muted-foreground">{goals.length} {t(locale, "noGoals").split(" ")[0]}</div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t(locale, "monthlySavings")}</p>
          <p className="text-3xl font-bold font-mono mt-1 text-primary">{fmt(savings)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {fmt(totalIncome)} — {fmt(totalExpenses)}
          </p>
        </div>

        <div className="space-y-3">
          {loading && <p className="text-center text-muted-foreground text-sm py-4">{t(locale, "loading")}</p>}
          {!loading && goals.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <Target className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t(locale, "noGoals")}</p>
            </div>
          )}
          {goals.map((goal) => {
            const months = monthsToGoal(goal.amount)
            const progress = savings > 0 ? Math.min((savings / Math.max(goal.amount / 12, 1)) * 100, 100) : 0
            return (
              <div key={goal.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{goal.title}</p>
                    <p className="font-mono text-sm text-muted-foreground mt-0.5">{fmt(goal.amount)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {months !== null && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{t(locale, "timeToReach")}</span>
                      <span className="font-mono">≈ {months} {t(locale, "months")}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {showAdd ? (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h3 className="font-medium">{t(locale, "addNew")}</h3>
            <input
              type="text"
              placeholder={t(locale, "goalNamePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={t(locale, "goalPricePlaceholder")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? t(locale, "saving") : t(locale, "add")}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted/40 transition"
              >
                {t(locale, "cancel")}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            <Plus className="size-4" />
            {t(locale, "addNew")}
          </button>
        )}
      </div>
      {showUpgrade && (
        <UpgradeModal reason="goal" onClose={() => setShowUpgrade(false)} />
      )}
    </div>
  )
}
