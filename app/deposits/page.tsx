"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, Calculator, ExternalLink } from "lucide-react"
import { useApp } from "@/lib/store"

const BANKS = [
  {
    key: "kaspi",
    name: "Kaspi Bank",
    logo: "🟡",
    color: "#f59e0b",
    url: "https://kaspi.kz/deposits",
    deposits: [
      { name: "Kaspi Gold", rate: 14.5, minAmount: 1000, term: 12, currency: "KZT", features: { kk: ["Онлайн ашу", "Мерзімінен бұрын алу мүмкін"], ru: ["Открыть онлайн", "Досрочное снятие"], en: ["Open online", "Early withdrawal"] } },
      { name: "Kaspi Save", rate: 16.0, minAmount: 500000, term: 12, currency: "KZT", features: { kk: ["Жоғары пайыз", "Капитализация"], ru: ["Высокий процент", "Капитализация"], en: ["High interest", "Capitalization"] } },
      { name: "Kaspi Term", rate: 18.5, minAmount: 1000000, term: 24, currency: "KZT", features: { kk: ["Максималды пайыз", "Мерзімді"], ru: ["Максимальный процент", "Срочный"], en: ["Maximum rate", "Term deposit"] } },
    ],
  },
  {
    key: "halyk",
    name: "Halyk Bank",
    logo: "🟢",
    color: "#10b981",
    url: "https://halykbank.kz/deposits",
    deposits: [
      { name: "Halyk Online", rate: 13.5, minAmount: 1000, term: 12, currency: "KZT", features: { kk: ["Онлайн ашу", "Сенімді банк"], ru: ["Открыть онлайн", "Надежный банк"], en: ["Open online", "Reliable bank"] } },
      { name: "Halyk Plus", rate: 15.0, minAmount: 300000, term: 12, currency: "KZT", features: { kk: ["Ай сайын пайыз", "Капитализация"], ru: ["Ежемесячный процент", "Капитализация"], en: ["Monthly interest", "Capitalization"] } },
      { name: "Halyk Max", rate: 17.0, minAmount: 1000000, term: 36, currency: "KZT", features: { kk: ["Максималды мерзім", "Жоғары пайыз"], ru: ["Максимальный срок", "Высокий процент"], en: ["Maximum term", "High interest"] } },
    ],
  },
  {
    key: "jusan",
    name: "Jusan Bank",
    logo: "🔵",
    color: "#6366f1",
    url: "https://jusanbank.kz/deposits",
    deposits: [
      { name: "Jusan Digital", rate: 15.5, minAmount: 1000, term: 12, currency: "KZT", features: { kk: ["100% цифрлық", "Жылдам ашу"], ru: ["100% цифровой", "Быстрое открытие"], en: ["100% digital", "Fast opening"] } },
      { name: "Jusan Plus", rate: 17.5, minAmount: 500000, term: 12, currency: "KZT", features: { kk: ["Жоғары пайыз", "Онлайн басқару"], ru: ["Высокий процент", "Онлайн управление"], en: ["High interest", "Online management"] } },
    ],
  },
  {
    key: "freedom",
    name: "Freedom Bank",
    logo: "🟠",
    color: "#f97316",
    url: "https://freedombank.kz/deposits",
    deposits: [
      { name: "Freedom Smart", rate: 16.5, minAmount: 10000, term: 12, currency: "KZT", features: { kk: ["Икемді шарттар", "Онлайн ашу"], ru: ["Гибкие условия", "Открыть онлайн"], en: ["Flexible terms", "Open online"] } },
      { name: "Freedom Max", rate: 19.0, minAmount: 1000000, term: 24, currency: "KZT", features: { kk: ["Ең жоғары пайыз", "Мерзімді"], ru: ["Максимальный процент", "Срочный"], en: ["Highest rate", "Term"] } },
    ],
  },
  {
    key: "forte",
    name: "ForteBank",
    logo: "🔴",
    color: "#ef4444",
    url: "https://forte.kz/deposits",
    deposits: [
      { name: "Forte Online", rate: 14.0, minAmount: 5000, term: 12, currency: "KZT", features: { kk: ["Онлайн ашу", "Сенімді"], ru: ["Открыть онлайн", "Надежный"], en: ["Open online", "Reliable"] } },
      { name: "Forte Premium", rate: 16.5, minAmount: 500000, term: 12, currency: "KZT", features: { kk: ["Премиум шарттар", "Жоғары пайыз"], ru: ["Премиум условия", "Высокий процент"], en: ["Premium terms", "High interest"] } },
    ],
  },
]

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

export default function DepositsPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [amount, setAmount] = useState("1000000")
  const [term, setTerm] = useState(12)
  const [sortBy, setSortBy] = useState<"rate" | "amount">("rate")

  const labels = {
    kk: {
      title: "Банк депозиттері",
      amount: "Депозит сомасы (₸)",
      term: "Мерзімі (ай)",
      sortBy: "Сұрыптау",
      byRate: "Пайыз бойынша",
      byAmount: "Сома бойынша",
      minAmount: "Мин. сома",
      rate: "Пайыз",
      profit: "Пайда",
      total: "Жалпы",
      openDeposit: "Депозит ашу",
      months: "ай",
      bestOffer: "Ең тиімді",
      features: "Артықшылықтар",
    },
    ru: {
      title: "Банковские депозиты",
      amount: "Сумма депозита (₸)",
      term: "Срок (месяцев)",
      sortBy: "Сортировка",
      byRate: "По ставке",
      byAmount: "По сумме",
      minAmount: "Мин. сумма",
      rate: "Ставка",
      profit: "Доход",
      total: "Итого",
      openDeposit: "Открыть депозит",
      months: "мес",
      bestOffer: "Лучшее предложение",
      features: "Преимущества",
    },
    en: {
      title: "Bank Deposits",
      amount: "Deposit amount (₸)",
      term: "Term (months)",
      sortBy: "Sort by",
      byRate: "By rate",
      byAmount: "By amount",
      minAmount: "Min. amount",
      rate: "Rate",
      profit: "Profit",
      total: "Total",
      openDeposit: "Open deposit",
      months: "mo",
      bestOffer: "Best offer",
      features: "Features",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  // Барлық депозиттерді жалпақтату
  const allDeposits = BANKS.flatMap((bank) =>
    bank.deposits
      .filter((d) => d.minAmount <= Number(amount) && d.term <= term)
      .map((d) => ({ ...d, bank }))
  )

  // Сұрыптау
  const sorted = [...allDeposits].sort((a, b) =>
    sortBy === "rate" ? b.rate - a.rate : b.rate * Number(amount) - a.rate * Number(amount)
  )

  function calcProfit(rate: number, amt: number, months: number): number {
    return Math.round((amt * rate / 100 / 12) * months)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">{tx.title}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Калькулятор */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.amount}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.term}</label>
            <div className="flex gap-2">
              {[3, 6, 12, 24, 36].map((t) => (
                <button
                  key={t}
                  onClick={() => setTerm(t)}
                  className={`flex-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                    term === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {t} {tx.months}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("rate")}
              className={`flex-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                sortBy === "rate" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
              }`}
            >
              {tx.byRate}
            </button>
            <button
              onClick={() => setSortBy("amount")}
              className={`flex-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                sortBy === "amount" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
              }`}
            >
              {tx.byAmount}
            </button>
          </div>
        </div>

        {/* Депозиттер тізімі */}
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {locale === "kk" ? "Сіздің шартыңызға сай депозит табылмады" :
               locale === "ru" ? "Депозиты по вашим условиям не найдены" :
               "No deposits found for your conditions"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((d, i) => {
              const profit = calcProfit(d.rate, Number(amount), term)
              const total = Number(amount) + profit
              const isFirst = i === 0

              return (
                <div
                  key={`${d.bank.key}-${d.name}`}
                  className={`rounded-2xl border bg-card overflow-hidden ${
                    isFirst ? "border-primary/40 shadow-lg shadow-primary/10" : "border-border"
                  }`}
                >
                  {isFirst && (
                    <div className="bg-gradient-to-r from-primary to-purple-600 px-4 py-1.5 flex items-center gap-2">
                      <span className="text-xs text-white font-medium">🏆 {tx.bestOffer}</span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{d.bank.logo}</span>
                        <div>
                          <p className="font-semibold text-sm">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.bank.name}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold" style={{ color: d.bank.color }}>
                          {d.rate}%
                        </p>
                        <p className="text-xs text-muted-foreground">{tx.rate}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="rounded-xl bg-muted/30 p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground">{tx.minAmount}</p>
                        <p className="text-xs font-mono font-bold mt-0.5">{fmt(d.minAmount)}</p>
                      </div>
                      <div className="rounded-xl bg-green-500/10 p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground">{tx.profit}</p>
                        <p className="text-xs font-mono font-bold text-green-500 mt-0.5">+{fmt(profit)}</p>
                      </div>
                      <div className="rounded-xl bg-primary/10 p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground">{tx.total}</p>
                        <p className="text-xs font-mono font-bold text-primary mt-0.5">{fmt(total)}</p>
                      </div>
                    </div>

                    {/* Артықшылықтар */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(d.features[locale as keyof typeof d.features] as string[]).map((f) => (
                        <span key={f} className="text-[10px] bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-full">
                          {f}
                        </span>
                      ))}
                    </div>

                    
                      href={d.bank.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-medium hover:bg-muted/40 transition-colors"
                    <a>
                      <ExternalLink className="size-3.5" />
                      {tx.openDeposit}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
