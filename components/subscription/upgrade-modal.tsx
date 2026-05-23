"use client"

import { useState } from "react"
import { X, Check, Zap, Crown, Users, Gift } from "lucide-react"
import { useApp } from "@/lib/store"

interface Props {
  onClose: () => void
  reason?: "chat" | "finance" | "goal" | "family" | "csv" | "analytics"
}

const PLANS = [
  {
    key: "pro",
    name: "Pro",
    price: "2,990 ₸",
    period: "/ ай",
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary",
    features: [
      "Шексіз AI чат",
      "Шексіз кіріс/шығыс",
      "100+ кітап",
      "Талдау диаграммалары",
      "CSV/SMS импорт",
      "Ай сайынғы есеп",
    ],
    highlighted: true,
  },
  {
    key: "family",
    name: "Отбасы",
    price: "4,990 ₸",
    period: "/ ай",
    icon: Users,
    color: "text-pink-400",
    bg: "bg-pink-500",
    features: [
      "Pro-дың бәрі",
      "5 мүшеге дейін",
      "Ортақ мақсаттар",
      "Отбасылық чат",
      "Геймификация",
    ],
    highlighted: false,
  },
]

const REASON_MESSAGES: Record<string, { kk: string; ru: string; en: string }> = {
  chat: {
    kk: "AI чат лимитіңіз таусылды. Pro-ға өтіп шексіз сөйлесіңіз!",
    ru: "Лимит AI чата исчерпан. Перейдите на Pro для безлимитного общения!",
    en: "AI chat limit reached. Upgrade to Pro for unlimited chat!",
  },
  finance: {
    kk: "Кіріс/шығыс лимитіңіз таусылды. Pro-ға өтіп шексіз жазба қосыңыз!",
    ru: "Лимит записей исчерпан. Перейдите на Pro для неограниченных записей!",
    en: "Finance limit reached. Upgrade to Pro for unlimited entries!",
  },
  goal: {
    kk: "Мақсат лимитіңіз таусылды. Pro-ға өтіп шексіз мақсат қосыңыз!",
    ru: "Лимит целей исчерпан. Перейдите на Pro для неограниченных целей!",
    en: "Goal limit reached. Upgrade to Pro for unlimited goals!",
  },
  family: {
    kk: "Отбасылық бюджет Pro+ мүмкіндігі. Отбасы жоспарына өтіңіз!",
    ru: "Семейный бюджет — функция Pro+. Перейдите на семейный план!",
    en: "Family budget is a Pro+ feature. Upgrade to Family plan!",
  },
  csv: {
    kk: "CSV/SMS импорт Pro мүмкіндігі. Pro-ға өтіңіз!",
    ru: "CSV/SMS импорт — функция Pro. Перейдите на Pro!",
    en: "CSV/SMS import is a Pro feature. Upgrade to Pro!",
  },
  analytics: {
    kk: "Талдау диаграммалары Pro мүмкіндігі. Pro-ға өтіңіз!",
    ru: "Аналитика — функция Pro. Перейдите на Pro!",
    en: "Analytics is a Pro feature. Upgrade to Pro!",
  },
}

export function UpgradeModal({ onClose, reason = "chat" }: Props) {
  const { profile } = useApp()
  const locale = profile.locale
  const [promoCode, setPromoCode] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoMessage, setPromoMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [selectedPlan, setSelectedPlan] = useState("pro")

  const reasonMsg = REASON_MESSAGES[reason]?.[locale] ?? REASON_MESSAGES.chat[locale]

  async function handlePromo() {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    const res = await fetch("/api/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "applyPromo", promoCode: promoCode.trim() }),
    })
    const data = await res.json()
    if (data.success) {
      setPromoMessage({
        text: locale === "kk" ? `${data.plan} жоспары ${data.days} күнге белсендірілді!` :
              locale === "ru" ? `План ${data.plan} активирован на ${data.days} дней!` :
              `${data.plan} plan activated for ${data.days} days!`,
        type: "success",
      })
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 2000)
    } else {
      setPromoMessage({ text: data.error, type: "error" })
    }
    setPromoLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition"
          >
            <X className="size-5" />
          </button>
          <Crown className="size-8 mb-3" />
          <h2 className="text-xl font-bold">
            {locale === "kk" ? "Pro-ға өтіңіз" : locale === "ru" ? "Перейти на Pro" : "Upgrade to Pro"}
          </h2>
          <p className="text-white/80 text-sm mt-1">{reasonMsg}</p>
        </div>

        <div className="p-6 space-y-4">

          {/* Trial banner */}
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 flex items-center gap-3">
            <Gift className="size-5 text-yellow-400 shrink-0" />
            <p className="text-sm">
              <span className="font-medium text-yellow-400">
                {locale === "kk" ? "7 күн тегін Pro!" :
                 locale === "ru" ? "7 дней Pro бесплатно!" :
                 "7 days Pro free!"}
              </span>{" "}
              <span className="text-muted-foreground">
                {locale === "kk" ? "Жаңа аккаунттарға автоматты беріледі" :
                 locale === "ru" ? "Автоматически для новых аккаунтов" :
                 "Automatically for new accounts"}
              </span>
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map((plan) => (
              <button
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  selectedPlan === plan.key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <plan.icon className={`size-4 ${plan.color}`} />
                  <span className="font-semibold text-sm">{plan.name}</span>
                </div>
                <p className="font-bold text-lg">{plan.price}</p>
                <p className="text-xs text-muted-foreground">{plan.period}</p>
                <ul className="mt-3 space-y-1">
                  {plan.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="size-3 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-xs text-primary">+{plan.features.length - 3} көбірек</li>
                  )}
                </ul>
              </button>
            ))}
          </div>

          {/* Promo code */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {locale === "kk" ? "Промо коды бар ма?" :
               locale === "ru" ? "Есть промо код?" :
               "Have a promo code?"}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={locale === "kk" ? "Промо кодты енгізіңіз" :
                            locale === "ru" ? "Введите промо код" : "Enter promo code"}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={handlePromo}
                disabled={promoLoading || !promoCode.trim()}
                className="rounded-xl bg-muted/50 px-4 py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-50"
              >
                {promoLoading ? "..." : locale === "kk" ? "Қолдану" : locale === "ru" ? "Применить" : "Apply"}
              </button>
            </div>
            {promoMessage && (
              <p className={`text-xs ${promoMessage.type === "success" ? "text-green-500" : "text-destructive"}`}>
                {promoMessage.text}
              </p>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              window.open("https://t.me/unemai_support", "_blank")
            }}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white py-3 text-sm font-medium hover:opacity-90 transition"
          >
            {locale === "kk" ? `${selectedPlan === "pro" ? "Pro" : "Отбасы"} жоспарын алу →` :
             locale === "ru" ? `Получить план ${selectedPlan === "pro" ? "Pro" : "Семья"} →` :
             `Get ${selectedPlan === "pro" ? "Pro" : "Family"} plan →`}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            {locale === "kk" ? "Telegram арқылы төлем жасаңыз" :
             locale === "ru" ? "Оплата через Telegram" :
             "Payment via Telegram"}
          </p>
        </div>
      </div>
    </div>
  )
}
