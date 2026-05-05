"use client"

import { useState } from "react"
import { Plus, Trash2, TrendingUp, TrendingDown, Target, ChevronDown, ChevronUp, X } from "lucide-react"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

const CURRENCIES = [
  { code: "KZT", symbol: "₸", name: "Теңге" },
  { code: "USD", symbol: "$", name: "Доллар" },
  { code: "EUR", symbol: "€", name: "Евро" },
  { code: "RUB", symbol: "₽", name: "Рубль" },
  { code: "CNY", symbol: "¥", name: "Юань" },
  { code: "GBP", symbol: "£", name: "Фунт" },
  { code: "AED", symbol: "د.إ", name: "Дирхам" },
  { code: "TRY", symbol: "₺", name: "Лира" },
  { code: "KGS", symbol: "с", name: "Сом" },
  { code: "UZS", symbol: "so'm", name: "Сўм" },
]

const PERIODS = [
  { label: "Апта", days: 7 },
  { label: "Ай", days: 30 },
  { label: "6 ай", days: 180 },
  { label: "Жыл", days: 365 },
]

function fmt(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

export function FinancePanel() {
  const { profile, expenses, goals, addExpense, removeExpense, addGoal, removeGoal, updateIncome } = useApp()

  const [showIncome, setShowIncome] = useState(false)
  const [showExpenses, setShowExpenses] = useState(false)
  const [showGoals, setShowGoals] = useState(false)

  // Жаңа шығыс
  const [newExpCategory, setNewExpCategory] = useState("")
  const [newExpAmount, setNewExpAmount] = useState("")
  const [newExpCurrency, setNewExpCurrency] = useState("KZT")
  const [newExpPeriod, setNewExpPeriod] = useState(30)
  const [showAddExp, setShowAddExp] = useState(false)

  // Жаңа мақсат
  const [newGoalTitle, setNewGoalTitle] = useState("")
  const [newGoalPrice, setNewGoalPrice] = useState("")
  const [newGoalCurrency, setNewGoalCurrency] = useState("KZT")
  const [showAddGoal, setShowAddGoal] = useState(false)

  // Жаңа кіріс
  const [newIncome, setNewIncome] = useState("")
  const [newIncomeCurrency, setNewIncomeCurrency] = useState("KZT")

  const income = profile.estimatedIncome ?? 0
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const savings = Math.max(income - totalExpenses, 0)

  // KZT-ке айналдыру (жуықша бағам)
  const toKZT: Record<string, number> = {
    KZT: 1, USD: 510, EUR: 550, RUB: 5.5,
    CNY: 70, GBP: 640, AED: 139, TRY: 16,
    KGS: 5.7, UZS: 0.04,
  }

  function convertToKZT(amount: number, currency: string): number {
    return Math.round(amount * (toKZT[currency] ?? 1))
  }

  function handleAddExpense() {
    if (!newExpCategory.trim() || !newExpAmount) return
    const amountKZT = convertToKZT(Number(newExpAmount), newExpCurrency)
    const monthlyAmount = Math.round(amountKZT * 30 / newExpPeriod)
    addExpense({ category: newExpCategory.trim(), amount: monthlyAmount })
    setNewExpCategory("")
    setNewExpAmount("")
    setNewExpCurrency("KZT")
    setNewExpPeriod(30)
    setShowAddExp(false)
  }

  function handleAddGoal() {
    if (!newGoalTitle.trim() || !newGoalPrice) return
    const priceKZT = convertToKZT(Number(newGoalPrice), newGoalCurrency)
    addGoal({ title: newGoalTitle.trim(), price: priceKZT })
    setNewGoalTitle("")
    setNewGoalPrice("")
    setNewGoalCurrency("KZT")
    setShowAddGoal(false)
  }

  function handleUpdateIncome() {
    if (!newIncome) return
    const amountKZT = convertToKZT(Number(newIncome), newIncomeCurrency)
    updateIncome(amountKZT)
    setNewIncome("")
    setShowIncome(false)
  }

  return (
    <div className="space-y-2">

      {/* Кіріс */}
      <div className="rounded-xl border border-sidebar-border bg-background/40 overflow-hidden">
        <button
          onClick={() => setShowIncome(!showIncome)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="size-3.5 text-primary" />
            <span className="font-medium">Кіріс</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{fmt(income)}</span>
            {showIncome ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </div>
        </button>

        {showIncome && (
          <div className="px-3 pb-3 space-y-2 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground pt-2">Ай сайынғы кіріс</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Сомасы"
                value={newIncome}
                onChange={(e) => setNewIncome(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              />
              <select
                value={newIncomeCurrency}
                onChange={(e) => setNewIncomeCurrency(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-2 text-sm outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleUpdateIncome}
              className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition"
            >
              Жаңарту
            </button>
          </div>
        )}
      </div>

      {/* Шығыстар */}
      <div className="rounded-xl border border-sidebar-border bg-background/40 overflow-hidden">
        <button
          onClick={() => setShowExpenses(!showExpenses)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TrendingDown className="size-3.5 text-foreground/70" />
            <span className="font-medium">Шығыстар</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{fmt(totalExpenses)}</span>
            {showExpenses ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </div>
        </button>

        {showExpenses && (
          <div className="px-3 pb-3 space-y-2 border-t border-sidebar-border">
            {/* Шығыстар тізімі */}
            <div className="space-y-1 pt-2 max-h-40 overflow-y-auto">
              {expenses.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Шығыс жоқ</p>
              )}
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-2 py-1.5">
                  <span className="text-xs truncate">{e.category}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-xs text-muted-foreground">{fmt(e.amount)}</span>
                    <button onClick={() => removeExpense(e.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Жаңа шығыс қосу */}
            {showAddExp ? (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <input
                  type="text"
                  placeholder="Атауы (мысалы: Тамақ)"
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Сомасы"
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                  <select
                    value={newExpCurrency}
                    onChange={(e) => setNewExpCurrency(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2 py-2 text-sm outline-none"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                    ))}
                  </select>
                </div>

                {/* Кезеңділік */}
                <div className="grid grid-cols-4 gap-1">
                  {PERIODS.map((p) => (
                    <button
                      key={p.days}
                      onClick={() => setNewExpPeriod(p.days)}
                      className={cn(
                        "rounded-lg py-1.5 text-xs font-medium transition-colors",
                        newExpPeriod === p.days
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddExpense}
                    className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition"
                  >
                    Қосу
                  </button>
                  <button
                    onClick={() => setShowAddExp(false)}
                    className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40 transition"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddExp(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
              >
                <Plus className="size-3.5" />
                Шығыс қосу
              </button>
            )}
          </div>
        )}
      </div>

      {/* Мақсаттар */}
      <div className="rounded-xl border border-sidebar-border bg-background/40 overflow-hidden">
        <button
          onClick={() => setShowGoals(!showGoals)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Target className="size-3.5 text-accent" />
            <span className="font-medium">Мақсаттар</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{goals.length} мақсат</span>
            {showGoals ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </div>
        </button>

        {showGoals && (
          <div className="px-3 pb-3 space-y-2 border-t border-sidebar-border">
            <div className="space-y-1 pt-2 max-h-40 overflow-y-auto">
              {goals.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Мақсат жоқ</p>
              )}
              {goals.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-2 py-1.5">
                  <span className="text-xs truncate">{g.title}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-xs text-muted-foreground">{fmt(g.price)}</span>
                    <button onClick={() => removeGoal(g.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showAddGoal ? (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <input
                  type="text"
                  placeholder="Мақсат атауы (мысалы: Телефон)"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Бағасы"
                    value={newGoalPrice}
                    onChange={(e) => setNewGoalPrice(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                  <select
                    value={newGoalCurrency}
                    onChange={(e) => setNewGoalCurrency(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2 py-2 text-sm outline-none"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddGoal}
                    className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition"
                  >
                    Қосу
                  </button>
                  <button
                    onClick={() => setShowAddGoal(false)}
                    className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40 transition"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddGoal(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="size-3.5" />
                Мақсат қосу
              </button>
            )}
          </div>
        )}
      </div>

      {/* Жинақ */}
      {income > 0 && (
        <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ай сайынғы жинақ</span>
            <span className="font-mono text-sm font-semibold text-primary">{fmt(savings)}</span>
          </div>
          {income > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${Math.min((savings / income) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
