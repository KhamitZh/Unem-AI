"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Zap, TrendingUp, TrendingDown, Target, BookOpen, BarChart2, Users, Gift } from "lucide-react"
import { useApp } from "@/lib/store"

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        close: () => void
        initDataUnsafe?: {
          user?: {
            id: number
            first_name: string
            username?: string
          }
        }
        MainButton: {
          show: () => void
          hide: () => void
          setText: (text: string) => void
          onClick: (fn: () => void) => void
        }
        BackButton: {
          show: () => void
          hide: () => void
          onClick: (fn: () => void) => void
        }
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        colorScheme: string
      }
    }
  }
}

function fmt(n: number): string {
  if (!n || n <= 0) return "0 ₸"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

export default function WebAppPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [finances, setFinances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tgUser, setTgUser] = useState<any>(null)

  useEffect(() => {
    // Telegram WebApp инициализация
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      tg.setHeaderColor("#0f1117")
      tg.setBackgroundColor("#0f1117")
      setTgUser(tg.initDataUnsafe?.user)
    }

    // Finances алу
    fetch("/api/finances")
      .then((r) => r.json())
      .then((d) => {
        setFinances(d.finances ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const incomes = finances.filter((f) => f.type === "income")
  const expenses = finances.filter((f) => f.type === "expense")
  const goals = finances.filter((f) => f.type === "goal")
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const savings = Math.max(totalIncome - totalExpenses, 0)
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0

  const QUICK_LINKS = [
    { icon: TrendingUp, label: locale === "kk" ? "Кіріс" : locale === "ru" ? "Доходы" : "Income", href: "/finances/income", color: "text-green-500", bg: "bg-green-500/10" },
    { icon: TrendingDown, label: locale === "kk" ? "Шығыс" : locale === "ru" ? "Расходы" : "Expenses", href: "/finances/expenses", color: "text-red-400", bg: "bg-red-400/10" },
    { icon: Target, label: locale === "kk" ? "Мақсат" : locale === "ru" ? "Цели" : "Goals", href: "/finances/goals", color: "text-purple-400", bg: "bg-purple-400/10" },
    { icon: BarChart2, label: locale === "kk" ? "Талдау" : locale === "ru" ? "Анализ" : "Analytics", href: "/analytics", color: "text-blue-400", bg: "bg-blue-400/10" },
    { icon: BookOpen, label: locale === "kk" ? "Кітаптар" : locale === "ru" ? "Книги" : "Books", href: "/books", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { icon: Users, label: locale === "kk" ? "Отбасы" : locale === "ru" ? "Семья" : "Family", href: "/family", color: "text-pink-400", bg: "bg-pink-400/10" },
    { icon: Gift, label: locale === "kk" ? "Реферал" : locale === "ru" ? "Реферал" : "Referral", href: "/referral", color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { icon: Zap, label: locale === "kk" ? "AI Чат" : locale === "ru" ? "AI Чат" : "AI Chat", href: "/", color: "text-primary", bg: "bg-primary/10" },
  ]

  return (
    <div className="min-h-screen bg-background pb-8">

      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 to-purple-600/10 px-4 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">U</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">Unem AI</h1>
            <p className="text-xs text-muted-foreground">
              {tgUser?.first_name
                ? (locale === "kk" ? `Сәлем, ${tgUser.first_name}!` : locale === "ru" ? `Привет, ${tgUser.first_name}!` : `Hi, ${tgUser.first_name}!`)
                : profile.name
                ? (locale === "kk" ? `Сәлем, ${profile.name}!` : locale === "ru" ? `Привет, ${profile.name}!` : `Hi, ${profile.name}!`)
                : "Unem AI"}
            </p>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-card/80 backdrop-blur border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {locale === "kk" ? "Кіріс" : locale === "ru" ? "Доход" : "Income"}
              </p>
              <p className="font-mono font-bold text-sm text-green-500">{fmt(totalIncome)}</p>
            </div>
            <div className="rounded-2xl bg-card/80 backdrop-blur border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {locale === "kk" ? "Жинақ" : locale === "ru" ? "Сбережения" : "Savings"}
              </p>
              <p className="font-mono font-bold text-sm text-primary">{fmt(savings)}</p>
            </div>
            <div className="rounded-2xl bg-card/80 backdrop-blur border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {locale === "kk" ? "Үнем" : locale === "ru" ? "Норма" : "Rate"}
              </p>
              <p className="font-mono font-bold text-sm text-purple-400">{savingsRate}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Мақсат */}
      {goals[0] && savings > 0 && (
        <div className="px-4 mt-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium">{goals[0].title}</p>
              <p className="text-xs text-primary font-mono">
                ≈{Math.ceil(goals[0].amount / savings)} {locale === "kk" ? "ай" : locale === "ru" ? "мес" : "mo"}
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
                style={{ width: `${Math.min((savings / Math.max(goals[0].amount / 12, 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="px-4 mt-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
          {locale === "kk" ? "Жылдам өту" : locale === "ru" ? "Быстрый переход" : "Quick access"}
        </p>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 hover:border-primary/30 transition-all"
            >
              <div className={`size-10 rounded-xl ${link.bg} flex items-center justify-center`}>
                <link.icon className={`size-5 ${link.color}`} />
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Chat батырмасы */}
      <div className="px-4 mt-4">
        <button
          onClick={() => router.push("/")}
          className="w-full rounded-2xl bg-gradient-to-r from-primary to-purple-600 text-white py-4 font-medium flex items-center justify-center gap-2 hover:opacity-90 transition"
        >
          <Zap className="size-5" />
          {locale === "kk" ? "AI кеңесшімен сөйлесу" : locale === "ru" ? "Поговорить с AI советником" : "Chat with AI advisor"}
        </button>
      </div>

    </div>
  )
}
