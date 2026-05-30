"use client"

import { useRouter } from "next/navigation"
import { X, TrendingUp, TrendingDown, Target, BarChart2, DollarSign, Receipt, BookOpen, Users, Trophy, Gift, Percent, LineChart, Building2, Sunset, Sparkles, Search, ChevronRight, Crown, Zap } from "lucide-react"
import { useApp } from "@/lib/store"
import { useSubscription } from "@/lib/use-subscription"
import { useState } from "react"

interface FunctionsPanelProps {
  open: boolean
  onClose: () => void
}

const FUNCTION_GROUPS = [
  {
    kk: "💰 Қаржы",
    ru: "💰 Финансы",
    en: "💰 Finance",
    items: [
      { icon: TrendingUp, kk: "Кіріс", ru: "Доходы", en: "Income", href: "/finances/income", color: "text-green-500", pro: false },
      { icon: TrendingDown, kk: "Шығыс", ru: "Расходы", en: "Expenses", href: "/finances/expenses", color: "text-red-400", pro: false },
      { icon: Target, kk: "Мақсаттар", ru: "Цели", en: "Goals", href: "/finances/goals", color: "text-accent", pro: false },
      { icon: Receipt, kk: "Транзакциялар", ru: "Транзакции", en: "Transactions", href: "/transactions", color: "text-orange-400", pro: true },
    ],
  },
  {
    kk: "📊 Талдау",
    ru: "📊 Аналитика",
    en: "📊 Analytics",
    items: [
      { icon: BarChart2, kk: "Диаграммалар", ru: "Диаграммы", en: "Charts", href: "/analytics", color: "text-blue-400", pro: false },
      { icon: Target, kk: "Мақсат тренер", ru: "Тренер целей", en: "Goal Tracker", href: "/goal-tracker", color: "text-purple-400", pro: false },
      { icon: Sparkles, kk: "AI Жоспар", ru: "AI План", en: "AI Plan", href: "/financial-plan", color: "text-violet-400", pro: false },
    ],
  },
  {
    kk: "🧮 Калькуляторлар",
    ru: "🧮 Калькуляторы",
    en: "🧮 Calculators",
    items: [
      { icon: Percent, kk: "Инфляция", ru: "Инфляция", en: "Inflation", href: "/inflation", color: "text-red-400", pro: false },
      { icon: LineChart, kk: "Инвестиция", ru: "Инвестиции", en: "Investment", href: "/investment", color: "text-purple-400", pro: false },
      { icon: Building2, kk: "Депозиттер", ru: "Депозиты", en: "Deposits", href: "/deposits", color: "text-green-400", pro: false },
      { icon: Sunset, kk: "Зейнет", ru: "Пенсия", en: "Retirement", href: "/retirement", color: "text-orange-400", pro: false },
      { icon: DollarSign, kk: "Валюта", ru: "Валюта", en: "Currency", href: "/currency", color: "text-yellow-400", pro: false },
    ],
  },
  {
    kk: "📚 Білім",
    ru: "📚 Обучение",
    en: "📚 Learning",
    items: [
      { icon: BookOpen, kk: "Кітаптар", ru: "Книги", en: "Books", href: "/books", color: "text-emerald-400", pro: false },
    ],
  },
  {
    kk: "👥 Әлеуметтік",
    ru: "👥 Социальное",
    en: "👥 Social",
    items: [
      { icon: Users, kk: "Қоғамдастық", ru: "Сообщество", en: "Community", href: "/community", color: "text-cyan-400", pro: true },
      { icon: Trophy, kk: "Лидерлер", ru: "Лидеры", en: "Leaderboard", href: "/leaderboard", color: "text-yellow-400", pro: false },
      { icon: Users, kk: "Отбасы", ru: "Семья", en: "Family", href: "/family", color: "text-pink-400", pro: true },
      { icon: Gift, kk: "Дос шақыру", ru: "Пригласить", en: "Invite", href: "/referral", color: "text-pink-400", pro: false },
    ],
  },
]

export function FunctionsPanel({ open, onClose }: FunctionsPanelProps) {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const { isPro } = useSubscription()
  const [search, setSearch] = useState("")

  const labels = {
    kk: { title: "Функциялар", search: "Іздеу...", proTag: "Pro" },
    ru: { title: "Функции", search: "Поиск...", proTag: "Pro" },
    en: { title: "Functions", search: "Search...", proTag: "Pro" },
  }
  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  function handleNav(href: string) {
    router.push(href)
    onClose()
    setSearch("")
  }

  // Іздеу фильтрі
  const filteredGroups = FUNCTION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const label = item[locale as keyof typeof item] as string
      return label?.toLowerCase().includes(search.toLowerCase())
    }),
  })).filter((group) => group.items.length > 0)

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 right-0 left-0 z-50 md:hidden rounded-t-3xl border-t border-border bg-background shadow-2xl max-h-[85vh] flex flex-col">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="size-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-bold text-lg">{tx.title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted/40 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Plan badge */}
        <div className="px-4 mb-2">
          {isPro ? (
            <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2">
              <Zap className="size-4 text-primary" />
              <span className="text-xs text-primary font-medium">Pro — барлық функциялар ашық</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-muted/30 border border-border px-3 py-2">
              <Crown className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Тегін нұсқа · Pro-ға өтіңіз</span>
            </div>
          )}
        </div>

        {/* Іздеу */}
        <div className="px-4 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={tx.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Функциялар тізімі */}
        <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-4">
          {filteredGroups.map((group) => (
            <div key={group.kk}>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                {group[locale as keyof typeof group] as string}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map((item) => {
                  const isLocked = item.pro && !isPro
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNav(item.href)}
                      className={`flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left transition-all hover:border-primary/30 hover:bg-muted/30 ${
                        isLocked ? "opacity-70" : ""
                      }`}
                    >
                      <div className={`size-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0`}>
                        <item.icon className={`size-4 ${item.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">
                          {item[locale as keyof typeof item] as string}
                        </p>
                        {isLocked && (
                          <p className="text-[10px] text-primary">Pro</p>
                        )}
                      </div>
                      <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
