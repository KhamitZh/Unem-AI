"use client"

import { useRouter } from "next/navigation"
import { X, TrendingUp, TrendingDown, Target, BarChart2, DollarSign, Receipt, BookOpen, Users, Trophy, Gift, Percent, LineChart, Building2, Sunset, Sparkles, Search, ChevronRight, Crown, Zap, FileText, Activity } from "lucide-react"
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
      { icon: TrendingUp, kk: "Кіріс", ru: "Доходы", en: "Income", href: "/finances/income", color: "#22c55e" },
      { icon: TrendingDown, kk: "Шығыс", ru: "Расходы", en: "Expenses", href: "/finances/expenses", color: "#f87171" },
      { icon: Target, kk: "Мақсаттар", ru: "Цели", en: "Goals", href: "/finances/goals", color: "#a78bfa" },
      { icon: Receipt, kk: "Транзакциялар", ru: "Транзакции", en: "Transactions", href: "/transactions", color: "#fb923c" },
    ],
  },
  {
    kk: "📊 Талдау",
    ru: "📊 Аналитика",
    en: "📊 Analytics",
    items: [
      { icon: BarChart2, kk: "Диаграммалар", ru: "Диаграммы", en: "Charts", href: "/analytics", color: "#60a5fa" },
      { icon: Target, kk: "Мақсат тренер", ru: "Тренер целей", en: "Goal Tracker", href: "/goal-tracker", color: "#c084fc" },
      { icon: Sparkles, kk: "AI Жоспар", ru: "AI План", en: "AI Plan", href: "/financial-plan", color: "#818cf8" },
      { icon: Sparkles, kk: "AI Инвестиция", ru: "AI Инвестиции", en: "AI Invest", href: "/ai-invest", color: "#a855f7" },
    ],
  },
  {
    kk: "🧮 Калькуляторлар",
    ru: "🧮 Калькуляторы",
    en: "🧮 Calculators",
    items: [
      { icon: Percent, kk: "Инфляция", ru: "Инфляция", en: "Inflation", href: "/inflation", color: "#f87171" },
      { icon: LineChart, kk: "Инвестиция", ru: "Инвестиции", en: "Investment", href: "/investment", color: "#c084fc" },
      { icon: Building2, kk: "Депозиттер", ru: "Депозиты", en: "Deposits", href: "/deposits", color: "#34d399" },
      { icon: Sunset, kk: "Зейнет", ru: "Пенсия", en: "Retirement", href: "/retirement", color: "#fb923c" },
      { icon: DollarSign, kk: "Валюта", ru: "Валюта", en: "Currency", href: "/currency", color: "#fbbf24" },
      { icon: FileText, kk: "Салық", ru: "Налоги", en: "Tax", href: "/tax", color: "#60a5fa" },
    ],
  },
  {
    kk: "📈 Нарық",
    ru: "📈 Рынок",
    en: "📈 Market",
    items: [
      { icon: Activity, kk: "KASE Нарық", ru: "Рынок KASE", en: "KASE Market", href: "/stocks", color: "#38bdf8" },
      { icon: Activity, kk: "Крипто", ru: "Крипто", en: "Crypto", href: "/crypto", color: "#fbbf24" },
    ],
  },
  {
    kk: "📚 Білім",
    ru: "📚 Обучение",
    en: "📚 Learning",
    items: [
      { icon: BookOpen, kk: "Кітаптар", ru: "Книги", en: "Books", href: "/books", color: "#34d399" },
    ],
  },
  {
    kk: "👥 Әлеуметтік",
    ru: "👥 Социальное",
    en: "👥 Social",
    items: [
      { icon: Users, kk: "Қоғамдастық", ru: "Сообщество", en: "Community", href: "/community", color: "#22d3ee" },
      { icon: Trophy, kk: "Лидерлер", ru: "Лидеры", en: "Leaderboard", href: "/leaderboard", color: "#fbbf24" },
      { icon: Users, kk: "Достар", ru: "Друзья", en: "Friends", href: "/friends", color: "#60a5fa" },
      { icon: Users, kk: "Отбасы", ru: "Семья", en: "Family", href: "/family", color: "#f472b6" },
      { icon: Gift, kk: "Дос шақыру", ru: "Пригласить", en: "Invite", href: "/referral", color: "#f472b6" },
      { icon: Trophy, kk: "Жетістіктер", ru: "Достижения", en: "Achievements", href: "/achievements", color: "#facc15" },
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
    kk: { title: "Функциялар", search: "Іздеу..." },
    ru: { title: "Функции", search: "Поиск..." },
    en: { title: "Functions", search: "Search..." },
  }
  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  function handleNav(href: string) {
    router.push(href)
    onClose()
    setSearch("")
  }

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
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 right-0 left-0 z-50 md:hidden rounded-t-[2rem] bg-[#0f1117] border-t border-white/10 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-12 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Unem AI" className="size-9 rounded-xl object-cover" />
            <div>
              <h2 className="font-bold text-base text-white">{tx.title}</h2>
              <p className="text-[10px] text-white/40">
                {isPro ? "Pro ✨" : locale === "kk" ? "Тегін нұсқа" : locale === "ru" ? "Бесплатный" : "Free plan"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="size-4 text-white/60" />
          </button>
        </div>

        {/* Іздеу */}
        <div className="px-5 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
            <input
              type="text"
              placeholder={tx.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-green-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Функциялар */}
        <div className="overflow-y-auto flex-1 px-5 pb-28 space-y-5">
          {filteredGroups.map((group) => (
            <div key={group.kk}>
              <p className="text-[10px] font-semibold text-white/30 mb-2.5 uppercase tracking-widest">
                {group[locale as keyof typeof group] as string}
              </p>
              <div className="grid grid-cols-4 gap-2.5">
                {group.items.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleNav(item.href)}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-white/5 border border-white/5 p-3 hover:bg-white/10 hover:border-white/10 transition-all active:scale-95"
                  >
                    <div
                      className="size-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: item.color + "20" }}
                    >
                      <item.icon className="size-5" style={{ color: item.color }} />
                    </div>
                    <span className="text-[9px] font-medium text-white/60 text-center leading-tight">
                      {item[locale as keyof typeof item] as string}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
