"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, TrendingDown, Calculator, RefreshCw } from "lucide-react"
import { useApp } from "@/lib/store"

// Қазақстан жылдық инфляция деректері
const KZ_INFLATION: Record<number, number> = {
  2015: 6.7, 2016: 14.6, 2017: 7.4, 2018: 5.3,
  2019: 5.4, 2020: 7.5, 2021: 8.4, 2022: 20.3,
  2023: 10.8, 2024: 8.6, 2025: 9.2,
}

const AVG_INFLATION = 9.5 // Орташа болжам

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B ₸`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ₸`
  if (n >= 1_000) return `${Math.round(n).toLocaleString()} ₸`
  return `${Math.round(n)} ₸`
}

export default function InflationPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale

  const [mode, setMode] = useState<"future" | "present">("future")
  const [amount, setAmount] = useState("")
  const [years, setYears] = useState("5")
  const [customInflation, setCustomInflation] = useState(String(AVG_INFLATION))
  const [result, setResult] = useState<any>(null)

  const labels = {
    kk: {
      title: "Инфляция калькуляторы",
      future: "Болашақ құны",
      present: "Қазіргі құны",
      amount: "Сомасы (₸)",
      years: "Жыл саны",
      inflation: "Жылдық инфляция (%)",
      calculate: "Есептеу",
      result: "Нәтиже",
      futureValue: "Болашақта керек",
      presentValue: "Қазір салу керек",
      lostValue: "Инфляциядан жоғалту",
      kzAvg: "Қазақстан орташасы",
      history: "Тарихи инфляция",
      tip: "Кеңес",
    },
    ru: {
      title: "Калькулятор инфляции",
      future: "Будущая стоимость",
      present: "Текущая стоимость",
      amount: "Сумма (₸)",
      years: "Количество лет",
      inflation: "Годовая инфляция (%)",
      calculate: "Рассчитать",
      result: "Результат",
      futureValue: "Понадобится в будущем",
      presentValue: "Нужно вложить сейчас",
      lostValue: "Потери от инфляции",
      kzAvg: "Среднее по Казахстану",
      history: "Историческая инфляция",
      tip: "Совет",
    },
    en: {
      title: "Inflation Calculator",
      future: "Future Value",
      present: "Present Value",
      amount: "Amount (₸)",
      years: "Number of years",
      inflation: "Annual inflation (%)",
      calculate: "Calculate",
      result: "Result",
      futureValue: "Will need in the future",
      presentValue: "Need to invest now",
      lostValue: "Lost to inflation",
      kzAvg: "Kazakhstan average",
      history: "Historical inflation",
      tip: "Tip",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  function calculate() {
    const a = Number(amount)
    const y = Number(years)
    const inf = Number(customInflation) / 100

    if (!a || !y || !inf) return

    if (mode === "future") {
      // Бүгінгі ақша болашақта қанша болады
      const futureValue = a * Math.pow(1 + inf, y)
      const lostValue = futureValue - a

      const yearByYear = Array.from({ length: y }, (_, i) => ({
        year: new Date().getFullYear() + i + 1,
        value: Math.round(a * Math.pow(1 + inf, i + 1)),
      }))

      setResult({ mode: "future", original: a, futureValue, lostValue, yearByYear, years: y })
    } else {
      // Болашақта X ₸ керек — қазір қанша болу керек
      const presentValue = a / Math.pow(1 + inf, y)
      const additionalNeeded = a - presentValue

      const yearByYear = Array.from({ length: y }, (_, i) => ({
        year: new Date().getFullYear() + i + 1,
        value: Math.round(a / Math.pow(1 + inf, y - i - 1)),
      }))

      setResult({ mode: "present", target: a, presentValue, additionalNeeded, yearByYear, years: y })
    }
  }

  function getTip(): string {
    if (!result) return ""
    const inf = Number(customInflation)

    if (locale === "kk") {
      if (inf > 10) return `Инфляция жоғары (${inf}%). Ақшаңызды депозитке немесе акцияға салыңыз!`
      if (result.mode === "future") return `${years} жылда ақшаңыз ${Math.round((result.futureValue / result.original - 1) * 100)}% қымбаттайды. Инвестиция жасаңыз!`
      return `Бүгін ${fmt(result.presentValue)} болса жеткілікті. Қалғанын инвестицияға салыңыз!`
    } else if (locale === "ru") {
      if (inf > 10) return `Инфляция высокая (${inf}%). Вложите деньги в депозит или акции!`
      if (result.mode === "future") return `За ${years} лет ваши деньги обесценятся на ${Math.round((result.futureValue / result.original - 1) * 100)}%. Инвестируйте!`
      return `Сегодня достаточно ${fmt(result.presentValue)}. Остальное инвестируйте!`
    } else {
      if (inf > 10) return `Inflation is high (${inf}%). Put your money in deposits or stocks!`
      if (result.mode === "future") return `In ${years} years your money will lose ${Math.round((result.futureValue / result.original - 1) * 100)}% value. Invest!`
      return `Today ${fmt(result.presentValue)} is enough. Invest the rest!`
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <TrendingDown className="size-5 text-red-400" />
          <h1 className="text-lg font-semibold">{tx.title}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setMode("future"); setResult(null) }}
            className={`rounded-xl py-3 text-sm font-medium transition-colors ${
              mode === "future" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
            }`}
          >
            {tx.future}
          </button>
          <button
            onClick={() => { setMode("present"); setResult(null) }}
            className={`rounded-xl py-3 text-sm font-medium transition-colors ${
              mode === "present" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
            }`}
          >
            {tx.present}
          </button>
        </div>

        {/* Input */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.amount}</label>
            <input
              type="number"
              placeholder="1 000 000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.years}</label>
            <div className="flex gap-2">
              {[1, 3, 5, 10, 20].map((y) => (
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
            <input
              type="number"
              placeholder="Жыл саны"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="w-full mt-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">{tx.inflation}</label>
              <button
                onClick={() => setCustomInflation(String(AVG_INFLATION))}
                className="text-xs text-primary hover:opacity-80 transition"
              >
                {tx.kzAvg}: {AVG_INFLATION}%
              </button>
            </div>
            <input
              type="number"
              step="0.1"
              value={customInflation}
              onChange={(e) => setCustomInflation(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
            />
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
          <div className="space-y-3">
            {result.mode === "future" ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
                <h3 className="font-semibold">{tx.result}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Бүгін</span>
                    <span className="font-mono font-bold">{fmt(result.original)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{years} жылдан кейін</span>
                    <span className="font-mono font-bold text-red-400">{fmt(result.futureValue)}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{tx.lostValue}</span>
                    <span className="font-mono font-bold text-red-500">-{fmt(result.lostValue)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <h3 className="font-semibold">{tx.result}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Мақсат ({years} жылдан кейін)</span>
                    <span className="font-mono font-bold">{fmt(result.target)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{tx.presentValue}</span>
                    <span className="font-mono font-bold text-primary">{fmt(result.presentValue)}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Инфляция үлесі</span>
                    <span className="font-mono font-bold text-red-400">+{fmt(result.additionalNeeded)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Жылдық кесте */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Жылдық динамика</p>
              </div>
              <div className="divide-y divide-border max-h-48 overflow-y-auto">
                {result.yearByYear.map((item: any, i: number) => {
                  const prev = i === 0 ? (result.original || result.presentValue) : result.yearByYear[i - 1].value
                  const diff = item.value - prev
                  return (
                    <div key={item.year} className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-sm">{item.year}</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs ${diff > 0 ? "text-red-400" : "text-green-500"}`}>
                          {diff > 0 ? "+" : ""}{fmt(diff)}
                        </span>
                        <span className="font-mono text-sm font-medium">{fmt(item.value)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Кеңес */}
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 flex gap-3">
              <span className="text-xl shrink-0">💡</span>
              <div>
                <p className="text-xs font-semibold text-yellow-400 mb-1">{tx.tip}</p>
                <p className="text-xs text-muted-foreground">{getTip()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Тарихи инфляция */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">🇰🇿 {tx.history}</p>
          </div>
          <div className="divide-y divide-border">
            {Object.entries(KZ_INFLATION).reverse().map(([year, inf]) => (
              <div key={year} className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm">{year}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${inf > 10 ? "bg-red-400" : inf > 7 ? "bg-yellow-400" : "bg-green-400"}`}
                      style={{ width: `${Math.min(inf / 25 * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`font-mono text-sm font-bold w-12 text-right ${
                    inf > 10 ? "text-red-400" : inf > 7 ? "text-yellow-400" : "text-green-400"
                  }`}>
                    {inf}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
