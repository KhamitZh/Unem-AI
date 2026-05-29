"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, TrendingUp, Calculator, Info } from "lucide-react"
import { useApp } from "@/lib/store"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts"

const INVESTMENT_TYPES = [
  { key: "deposit", rate: 14.5, risk: "low", kk: "Банк депозиті", ru: "Банковский депозит", en: "Bank Deposit", color: "#10b981", icon: "🏦" },
  { key: "bonds", rate: 13.0, risk: "low", kk: "Мемлекеттік облигациялар", ru: "Гособлигации", en: "Gov Bonds", color: "#06b6d4", icon: "📜" },
  { key: "etf", rate: 18.0, risk: "medium", kk: "Қазақстан ETF", ru: "ETF Казахстан", en: "Kazakhstan ETF", color: "#6366f1", icon: "📈" },
  { key: "stock", rate: 22.0, risk: "medium", kk: "Акциялар", ru: "Акции", en: "Stocks", color: "#8b5cf6", icon: "💹" },
  { key: "realestate", rate: 12.0, risk: "low", kk: "Жылжымайтын мүлік", ru: "Недвижимость", en: "Real Estate", color: "#f59e0b", icon: "🏠" },
  { key: "crypto", rate: 45.0, risk: "high", kk: "Криптовалюта", ru: "Криптовалюта", en: "Crypto", color: "#f97316", icon: "₿" },
]

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B ₸`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ₸`
  if (n >= 1_000) return `${Math.round(n).toLocaleString()} ₸`
  return `${Math.round(n)} ₸`
}

export default function InvestmentPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale

  const [initialAmount, setInitialAmount] = useState("")
  const [monthlyAmount, setMonthlyAmount] = useState("")
  const [years, setYears] = useState("10")
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["deposit"])
  const [result, setResult] = useState<any>(null)

  const labels = {
    kk: {
      title: "Инвестиция симулятор",
      initial: "Бастапқы сома (₸)",
      monthly: "Ай сайынғы қосымша (₸)",
      years: "Жыл саны",
      types: "Инвестиция түрі",
      calculate: "Есептеу",
      result: "Нәтиже",
      totalInvested: "Жалпы салынған",
      totalReturn: "Жалпы пайда",
      finalAmount: "Соңғы сома",
      risk: { low: "Төмен тәуекел", medium: "Орташа тәуекел", high: "Жоғары тәуекел" },
      tip: "Кеңес",
      yearlyGrowth: "Жылдық өсім",
    },
    ru: {
      title: "Симулятор инвестиций",
      initial: "Начальная сумма (₸)",
      monthly: "Ежемесячное пополнение (₸)",
      years: "Количество лет",
      types: "Тип инвестиции",
      calculate: "Рассчитать",
      result: "Результат",
      totalInvested: "Всего вложено",
      totalReturn: "Общая прибыль",
      finalAmount: "Итоговая сумма",
      risk: { low: "Низкий риск", medium: "Средний риск", high: "Высокий риск" },
      tip: "Совет",
      yearlyGrowth: "Годовой рост",
    },
    en: {
      title: "Investment Simulator",
      initial: "Initial amount (₸)",
      monthly: "Monthly addition (₸)",
      years: "Number of years",
      types: "Investment type",
      calculate: "Calculate",
      result: "Result",
      totalInvested: "Total invested",
      totalReturn: "Total profit",
      finalAmount: "Final amount",
      risk: { low: "Low risk", medium: "Medium risk", high: "High risk" },
      tip: "Tip",
      yearlyGrowth: "Yearly growth",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  function toggleType(key: string) {
    setSelectedTypes((prev) =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter((k) => k !== key) : prev
        : [...prev, key]
    )
  }

  function calculate() {
    const initial = Number(initialAmount) || 0
    const monthly = Number(monthlyAmount) || 0
    const y = Number(years)

    if (!initial && !monthly) return

    const results: any[] = []

    selectedTypes.forEach((typeKey) => {
      const type = INVESTMENT_TYPES.find((t) => t.key === typeKey)!
      const rate = type.rate / 100
      const monthlyRate = rate / 12

      const yearByYear = []
      let total = initial

      for (let yr = 1; yr <= y; yr++) {
        for (let m = 0; m < 12; m++) {
          total = total * (1 + monthlyRate) + monthly
        }
        yearByYear.push({
          year: new Date().getFullYear() + yr,
          [typeKey]: Math.round(total),
        })
      }

      const totalInvested = initial + monthly * 12 * y
      const finalAmount = yearByYear[yearByYear.length - 1]?.[typeKey] ?? 0
      const profit = finalAmount - totalInvested

      results.push({
        type,
        yearByYear,
        totalInvested,
        finalAmount,
        profit,
        profitPercent: Math.round((profit / totalInvested) * 100),
      })
    })

    // Графика деректерін біріктіру
    const chartData = results[0].yearByYear.map((item: any, i: number) => {
      const merged: any = { year: item.year }
      results.forEach((r) => {
        merged[r.type.key] = r.yearByYear[i]?.[r.type.key] ?? 0
      })
      return merged
    })

    setResult({ results, chartData, totalInvested: results[0].totalInvested })
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">{tx.title}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Input */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.initial}</label>
            <input
              type="number"
              placeholder="1 000 000"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.monthly}</label>
            <input
              type="number"
              placeholder="50 000"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.years}</label>
            <div className="flex gap-2">
              {[1, 3, 5, 10, 20, 30].map((y) => (
                <button
                  key={y}
                  onClick={() => setYears(String(y))}
                  className={`flex-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                    years === String(y)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.types}</label>
            <div className="grid grid-cols-2 gap-2">
              {INVESTMENT_TYPES.map((type) => (
                <button
                  key={type.key}
                  onClick={() => toggleType(type.key)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${
                    selectedTypes.includes(type.key)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-lg">{type.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {type[locale as keyof typeof type] as string}
                    </p>
                    <p className="text-[10px] text-muted-foreground">~{type.rate}%/жыл</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={calculate}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white py-3 text-sm font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Calculator className="size-4" />
            {tx.calculate}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-4">

            {/* График */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-4">{tx.yearlyGrowth}</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={result.chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tickFormatter={(v) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v/1000)}k` : v} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const type = INVESTMENT_TYPES.find((t) => t.key === name)
                      return [fmt(value), type?.[locale as keyof typeof type] as string ?? name]
                    }}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                  />
                  <Legend />
                  {result.results.map((r: any) => (
                    <Area
                      key={r.type.key}
                      type="monotone"
                      dataKey={r.type.key}
                      stroke={r.type.color}
                      fill={r.type.color + "20"}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Нәтижелер */}
            {result.results.map((r: any) => (
              <div key={r.type.key} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{r.type.icon}</span>
                  <div>
                    <p className="font-semibold">{r.type[locale as keyof typeof r.type] as string}</p>
                    <p className="text-xs text-muted-foreground">~{r.type.rate}%/жыл</p>
                  </div>
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    r.type.risk === "low" ? "bg-green-500/10 text-green-500" :
                    r.type.risk === "medium" ? "bg-yellow-500/10 text-yellow-500" :
                    "bg-red-500/10 text-red-500"
                  }`}>
                    {tx.risk[r.type.risk as keyof typeof tx.risk]}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{tx.totalInvested}</span>
                    <span className="font-mono text-sm">{fmt(r.totalInvested)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{tx.totalReturn}</span>
                    <span className="font-mono text-sm text-green-500">+{fmt(r.profit)} (+{r.profitPercent}%)</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{tx.finalAmount}</span>
                    <span className="font-mono font-bold text-primary">{fmt(r.finalAmount)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Кеңес */}
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 flex gap-3">
              <span className="text-xl shrink-0">💡</span>
              <div>
                <p className="text-xs font-semibold text-yellow-400 mb-1">{tx.tip}</p>
                <p className="text-xs text-muted-foreground">
                  {locale === "kk"
                    ? "Инвестициялардың болашақ кірістілігі кепілдендірілмейді. Тәуекелді мұқият бағалаңыз!"
                    : locale === "ru"
                    ? "Будущая доходность инвестиций не гарантирована. Тщательно оценивайте риски!"
                    : "Future investment returns are not guaranteed. Carefully assess the risks!"}
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
