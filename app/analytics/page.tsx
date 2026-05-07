"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Target } from "lucide-react"
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff"]

function fmt(n: number): string {
  if (!n || n <= 0) return "0"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1000)}k`
  return `${n}`
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [finances, setFinances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/finances")
      .then((r) => r.json())
      .then((d) => {
        setFinances(d.finances ?? [])
        setLoading(false)
      })
  }, [])

  const incomes = finances.filter((f) => f.type === "income")
  const expenses = finances.filter((f) => f.type === "expense")
  const goals = finances.filter((f) => f.type === "goal")

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const savings = Math.max(totalIncome - totalExpenses, 0)
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0

  // Bar chart деректері
  const barData = [
    { name: t(locale, "income"), amount: totalIncome, fill: "#6366f1" },
    { name: t(locale, "expenses"), amount: totalExpenses, fill: "#8b5cf6" },
    { name: t(locale, "savingsWord"), amount: savings, fill: "#a78bfa" },
  ]

  // Pie chart деректері — шығыс категориялары
  const pieData = expenses.map((e, i) => ({
    name: e.title,
    value: e.amount,
    color: COLORS[i % COLORS.length],
  }))

  // Line chart деректері — мақсатқа жету болжамы
  const lineData = Array.from({ length: 12 }, (_, i) => ({
    month: `${i + 1} ${t(locale, "months")}`,
    жинақ: savings * (i + 1),
    мақсат: goals[0]?.amount ?? 0,
  }))

  // Stats cards
  const stats = [
    { label: t(locale, "income"), value: `${fmt(totalIncome)} ₸`, icon: TrendingUp, color: "text-primary" },
    { label: t(locale, "expenses"), value: `${fmt(totalExpenses)} ₸`, icon: TrendingDown, color: "text-foreground/70" },
    { label: t(locale, "savingsWord"), value: `${fmt(savings)} ₸`, icon: Wallet, color: "text-green-500" },
    { label: t(locale, "savingsRate"), value: `${savingsRate}%`, icon: Target, color: "text-accent" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t(locale, "loading")}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold">{t(locale, "analytics")}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`size-4 ${color}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className={`font-mono font-bold text-xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Bar chart — Кіріс vs Шығыс vs Жинақ */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">{t(locale, "income")} vs {t(locale, "expenses")} vs {t(locale, "savingsWord")}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                formatter={(value: number) => [`${fmt(value)} ₸`, ""]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — Шығыс категориялары */}
        {pieData.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">{t(locale, "expenses")} — категориялар</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${fmt(value)} ₸`, ""]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs truncate">{entry.name}</span>
                    <span className="text-xs font-mono ml-auto shrink-0">{fmt(entry.value)} ₸</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Line chart — Мақсатқа жету болжамы */}
        {goals.length > 0 && savings > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-1">{t(locale, "goals")} — {t(locale, "timeToReach")}</h2>
            <p className="text-xs text-muted-foreground mb-4">{goals[0]?.title}: {fmt(goals[0]?.amount)} ₸</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  formatter={(value: number) => [`${fmt(value)} ₸`, ""]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="жинақ" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="мақсат" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Деректер жоқ */}
        {finances.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground text-sm">{t(locale, "noIncome")}</p>
            <p className="text-xs text-muted-foreground mt-1">Кіріс пен шығыс қосыңыз</p>
          </div>
        )}

      </div>
    </div>
  )
}
