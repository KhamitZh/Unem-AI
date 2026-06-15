"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Search, Lock } from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts"
import { useApp } from "@/lib/store"
import { useSubscription } from "@/lib/use-subscription"
import { UpgradeModal } from "@/components/subscription/upgrade-modal"

function fmt(n: number): string {
  if (n === 0) return "0 ₸"
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(
    locale === "kk" ? "kk-KZ" : locale === "ru" ? "ru-RU" : "en-US",
    { month: "short", day: "numeric" }
  )
}

const PERIODS = [
  { key: "week", kk: "Апталық", ru: "Неделя", en: "Weekly" },
  { key: "month", kk: "Айлық", ru: "Месяц", en: "Monthly" },
  { key: "year", kk: "Жылдық", ru: "Годовой", en: "Yearly" },
]

const CustomTooltip = ({ active, payload, label, locale }: any) => {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div className="rounded-xl border border-border bg-card shadow-xl p-3 min-w-[160px]">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-xs text-green-500">↑ {locale === "kk" ? "Кіріс" : locale === "ru" ? "Доход" : "Income"}</span>
          <span className="text-xs font-mono text-green-500">+{fmt(data.income)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-xs text-red-400">↓ {locale === "kk" ? "Шығыс" : locale === "ru" ? "Расход" : "Expense"}</span>
          <span className="text-xs font-mono text-red-400">-{fmt(data.expense)}</span>
        </div>
        <div className="h-px bg-border my-1" />
        <div className="flex justify-between gap-4">
          <span className={`text-xs font-medium ${data.profit >= 0 ? "text-primary" : "text-red-400"}`}>
            {locale === "kk" ? "Нәтиже" : locale === "ru" ? "Итог" : "Result"}
          </span>
          <span className={`text-xs font-mono font-bold ${data.profit >= 0 ? "text-primary" : "text-red-400"}`}>
            {data.profit >= 0 ? "+" : ""}{fmt(data.profit)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const { isPro } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [period, setPeriod] = useState("month")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedDayData, setSelectedDayData] = useState<any>(null)
  const [searchDate, setSearchDate] = useState("")
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)

  useEffect(() => {
    loadData()
  }, [period])

  async function loadData() {
    setLoading(true)
    if (loading) {
      return (
        <div className="min-h-screen bg-background pb-24">
          <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-lg font-semibold">{tx.title}</h1>
          </div>
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  <div className="h-3 w-16 rounded-full bg-muted/50 animate-pulse" />
                  <div className="h-6 w-24 rounded-full bg-muted/50 animate-pulse" />
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="h-4 w-32 rounded-full bg-muted/50 animate-pulse mb-4" />
              <div className="h-52 w-full rounded-xl bg-muted/50 animate-pulse" />
            </div>
          </div>
        </div>
      )
    }
    const now = new Date()
    let from = ""
    let to = now.toISOString().split("T")[0]

    if (period === "week") {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      from = d.toISOString().split("T")[0]
    } else if (period === "month") {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      from = d.toISOString().split("T")[0]
    } else {
      const d = new Date(now)
      d.setFullYear(d.getFullYear() - 1)
      from = d.toISOString().split("T")[0]
    }

    const res = await fetch(`/api/daily-analysis?from=${from}&to=${to}`)
    const json = await res.json()
    const analysis = json.analysis ?? []

    // Барлық күндерді толтыру
    const allDays: any[] = []
    const current = new Date(from)
    const end = new Date(to)

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0]
      const found = analysis.find((a: any) => a.date === dateStr)
      allDays.push({
        date: dateStr,
        label: formatDate(dateStr, locale),
        income: found?.income ?? 0,
        expense: found?.expense ?? 0,
        profit: found?.profit ?? 0,
        income_items: found?.income_items ?? [],
        expense_items: found?.expense_items ?? [],
      })
      current.setDate(current.getDate() + 1)
    }

    setData(allDays)
    setTotalIncome(allDays.reduce((s, d) => s + d.income, 0))
    setTotalExpense(allDays.reduce((s, d) => s + d.expense, 0))
    setLoading(false)
  }

  function handleChartClick(chartData: any) {
    if (!isPro) {
      setShowUpgrade(true)
      return
    }
    if (chartData?.activePayload?.[0]) {
      const d = chartData.activePayload[0].payload
      setSelectedDate(d.date)
      setSelectedDayData(d)
    }
  }

  async function handleSearchDate(dateStr: string) {
    if (!isPro) {
      setShowUpgrade(true)
      return
    }
    if (!dateStr) return
    const found = data.find((d) => d.date === dateStr)
    if (found) {
      setSelectedDate(found.date)
      setSelectedDayData(found)
    } else {
      const res = await fetch(`/api/daily-analysis?date=${dateStr}`)
      const json = await res.json()
      if (json.analysis?.length > 0) {
        const d = json.analysis[0]
        setSelectedDayData({
          ...d,
          label: formatDate(d.date, locale),
        })
        setSelectedDate(d.date)
      } else {
        setSelectedDayData({ date: dateStr, income: 0, expense: 0, profit: 0, income_items: [], expense_items: [] })
        setSelectedDate(dateStr)
      }
    }
  }

  const totalProfit = totalIncome - totalExpense

  const labels = {
    kk: { title: "Талдау", income: "Кіріс", expense: "Шығыс", profit: "Нәтиже", noData: "Деректер жоқ", incomeTable: "Кіріс", expenseTable: "Шығыс", source: "Табыс", amount: "Көлемі", category: "Категория", proOnly: "Нүктелі талдау тек Pro үшін" },
    ru: { title: "Аналитика", income: "Доход", expense: "Расход", profit: "Итог", noData: "Нет данных", incomeTable: "Доходы", expenseTable: "Расходы", source: "Источник", amount: "Сумма", category: "Категория", proOnly: "Детальный анализ только для Pro" },
    en: { title: "Analytics", income: "Income", expense: "Expense", profit: "Result", noData: "No data", incomeTable: "Income", expenseTable: "Expenses", source: "Source", amount: "Amount", category: "Category", proOnly: "Detailed analysis for Pro only" },
  }
  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold">{tx.title}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="size-3.5 text-green-500" />
              <span className="text-xs text-muted-foreground">{tx.income}</span>
            </div>
            <p className="font-mono font-bold text-green-500">{fmt(totalIncome)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown className="size-3.5 text-red-400" />
              <span className="text-xs text-muted-foreground">{tx.expense}</span>
            </div>
            <p className="font-mono font-bold text-red-400">{fmt(totalExpense)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Wallet className={`size-3.5 ${totalProfit >= 0 ? "text-primary" : "text-red-400"}`} />
              <span className="text-xs text-muted-foreground">{tx.profit}</span>
            </div>
            <p className={`font-mono font-bold ${totalProfit >= 0 ? "text-primary" : "text-red-400"}`}>
              {totalProfit >= 0 ? "+" : ""}{fmt(totalProfit)}
            </p>
          </div>
        </div>

        {/* Period selector */}
        <div className="grid grid-cols-3 gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
                period === p.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {p[locale as keyof typeof p]}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-4">
            {locale === "kk" ? "Кіріс/Шығыс динамикасы" :
             locale === "ru" ? "Динамика доходов/расходов" : "Income/Expense dynamics"}
            {!isPro && (
              <span className="ml-2 text-primary text-xs">
                · {locale === "kk" ? "Нүктені басу үшін Pro керек" :
                   locale === "ru" ? "Нажмите на точку в Pro" : "Click point with Pro"}
              </span>
            )}
          </p>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                {locale === "kk" ? "Жүктелуде..." : locale === "ru" ? "Загрузка..." : "Loading..."}
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">{tx.noData}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={data}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                onClick={handleChartClick}
                style={{ cursor: isPro ? "pointer" : "default" }}
              >
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  interval={period === "year" ? 30 : period === "month" ? 6 : 1}
                />
                <YAxis
                  tickFormatter={(v) => v >= 1000 ? `${Math.round(v/1000)}k` : v}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip content={<CustomTooltip locale={locale} />} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#incomeGrad)"
                  dot={isPro ? { r: 3, fill: "#22c55e" } : false}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f87171"
                  strokeWidth={2}
                  fill="url(#expenseGrad)"
                  dot={isPro ? { r: 3, fill: "#f87171" } : false}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#profitGrad)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Дата іздеу — тек Pro */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              {locale === "kk" ? "Күнді таңдау" : locale === "ru" ? "Выбрать дату" : "Select date"}
            </p>
            {!isPro && <Lock className="size-3.5 text-primary ml-auto" />}
          </div>

          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            onBlur={() => {
              if (searchDate) handleSearchDate(searchDate)
            }}
            onClick={() => { if (!isPro) setShowUpgrade(true) }}
            readOnly={!isPro}
            className={`w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors ${
              !isPro ? "opacity-50 cursor-pointer" : ""
            }`}
          />

          {!isPro && (
            <p className="text-xs text-muted-foreground text-center">{tx.proOnly}</p>
          )}
        </div>

        {/* Таңдалған күн деректері */}
        {selectedDayData && isPro && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold mb-3">
                📅 {formatDate(selectedDate, locale)}
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">{tx.income}</p>
                  <p className="font-mono font-bold text-green-500">+{fmt(selectedDayData.income)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{tx.expense}</p>
                  <p className="font-mono font-bold text-red-400">-{fmt(selectedDayData.expense)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{tx.profit}</p>
                  <p className={`font-mono font-bold ${selectedDayData.profit >= 0 ? "text-primary" : "text-red-400"}`}>
                    {selectedDayData.profit >= 0 ? "+" : ""}{fmt(selectedDayData.profit)}
                  </p>
                </div>
              </div>
            </div>

            {/* Кіріс кестесі */}
            {selectedDayData.income_items?.length > 0 && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-green-500/5">
                  <p className="text-sm font-semibold text-green-500">✅ {tx.incomeTable}</p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left text-xs text-muted-foreground">{tx.source}</th>
                      <th className="px-4 py-2 text-right text-xs text-muted-foreground">{tx.amount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedDayData.income_items.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 text-sm">{item.name}</td>
                        <td className="px-4 py-2.5 text-sm font-mono text-right text-green-500">+{fmt(item.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/20">
                      <td className="px-4 py-2 text-xs font-semibold text-muted-foreground">Жалпы</td>
                      <td className="px-4 py-2 text-sm font-mono font-bold text-right text-green-500">+{fmt(selectedDayData.income)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Шығыс кестесі */}
            {selectedDayData.expense_items?.length > 0 && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-red-500/5">
                  <p className="text-sm font-semibold text-red-400">❌ {tx.expenseTable}</p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left text-xs text-muted-foreground">{tx.category}</th>
                      <th className="px-4 py-2 text-right text-xs text-muted-foreground">{tx.amount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedDayData.expense_items.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 text-sm">{item.name}</td>
                        <td className="px-4 py-2.5 text-sm font-mono text-right text-red-400">-{fmt(item.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/20">
                      <td className="px-4 py-2 text-xs font-semibold text-muted-foreground">Жалпы</td>
                      <td className="px-4 py-2 text-sm font-mono font-bold text-right text-red-400">-{fmt(selectedDayData.expense)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {selectedDayData.income === 0 && selectedDayData.expense === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">{tx.noData}</p>
            )}
          </div>
        )}

      </div>

      {showUpgrade && (
        <UpgradeModal reason="analytics" onClose={() => setShowUpgrade(false)} />
      )}
    </div>
  )
}
