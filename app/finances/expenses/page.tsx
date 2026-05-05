"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, TrendingDown } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

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

export default function ExpensesPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("KZT")
  const [periodDays, setPeriodDays] = useState(30)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  const PERIODS = [
    { label: t(locale, "perWeek"), days: 7 },
    { label: t(locale, "perMonth"), days: 30 },
    { label: t(locale, "per6Month"), days: 180 },
    { label: t(locale, "perYear"), days: 365 },
  ]

  useEffect(() => {
    fetch("/api/finances")
      .then((r) => r.json())
      .then((d) => {
        setExpenses((d.finances ?? []).filter((f: any) => f.type === "expense"))
        setLoading(false)
      })
  }, [])

  async function handleAdd() {
    if (!title.trim() || !amount) return
    setSaving(true)
    const amountKZT = Math.round(Number(amount) * (toKZT[currency] ?? 1) * 30 / periodDays)
    const res = await fetch("/api/finances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "expense", title: title.trim(), amount: amountKZT, currency, period_days: periodDays }),
    })
    const data = await res.json()
    setExpenses((prev) => [data.finance, ...prev])
    setTitle("")
    setAmount("")
    setCurrency("KZT")
    setPeriodDays(30)
    setShowAdd(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/finances?id=${id}`, { method: "DELETE" })
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <TrendingDown className="size-5 text-foreground/70" />
          <h1 className="text-lg font-semibold">{t(locale, "expenses")}</h1>
        </div>
        <div className="ml-auto font-mono text-sm text-muted-foreground">{fmt(total)}</div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t(locale, "totalExpenses")}</p>
          <p className="text-3xl font-bold font-mono mt-1">{fmt(total)}</p>
          <p className="text-xs text-muted-foreground mt-1">{expenses.length} {t(locale, "expenseCategory")}</p>
        </div>

        <div className="space-y-2">
          {loading && <p className="text-center text-muted-foreground text-sm py-4">{t(locale, "loading")}</p>}
          {!loading && expenses.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <TrendingDown className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t(locale, "noExpenses")}</p>
            </div>
          )}
          {expenses.map((expense) => (
            <div key={expense.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{expense.title}</p>
                <p className="text-xs text-muted-foreground">{t(locale, "perMonth")}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-sm">{fmt(expense.amount)}</span>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAdd ? (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h3 className="font-medium">{t(locale, "addNew")}</h3>
            <input
              type="text"
              placeholder={t(locale, "namePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={t(locale, "amountPlaceholder")}
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

            <div className="grid grid-cols-4 gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setPeriodDays(p.days)}
                  className={`rounded-xl py-2 text-xs font-medium transition-colors ${
                    periodDays === p.days
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {p.label}
                </button>
              ))}
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
    </div>
  )
}
