"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

const BASE_CURRENCIES = ["USD", "EUR", "RUB", "CNY", "GBP", "AED", "TRY", "KGS", "UZS"]

const CURRENCY_NAMES: Record<string, { kk: string; ru: string; en: string }> = {
  USD: { kk: "АҚШ Доллары", ru: "Доллар США", en: "US Dollar" },
  EUR: { kk: "Еуро", ru: "Евро", en: "Euro" },
  RUB: { kk: "Ресей Рублі", ru: "Российский Рубль", en: "Russian Ruble" },
  CNY: { kk: "Қытай Юані", ru: "Китайский Юань", en: "Chinese Yuan" },
  GBP: { kk: "Британ Фунты", ru: "Британский Фунт", en: "British Pound" },
  AED: { kk: "БАӘ Дирхамы", ru: "Дирхам ОАЭ", en: "UAE Dirham" },
  TRY: { kk: "Түрік Лирасы", ru: "Турецкая Лира", en: "Turkish Lira" },
  KGS: { kk: "Қырғыз Сомы", ru: "Кыргызский Сом", en: "Kyrgyz Som" },
  UZS: { kk: "Өзбек Сўмы", ru: "Узбекский Сум", en: "Uzbek Som" },
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", RUB: "🇷🇺", CNY: "🇨🇳",
  GBP: "🇬🇧", AED: "🇦🇪", TRY: "🇹🇷", KGS: "🇰🇬", UZS: "🇺🇿",
}

export default function CurrencyPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [amount, setAmount] = useState("1")
  const [fromCurrency, setFromCurrency] = useState("USD")
  const [toCurrency, setToCurrency] = useState("KZT")
  const [converting, setConverting] = useState(false)

  async function fetchRates() {
    setLoading(true)
    try {
      const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/KZT`)
      const data = await res.json()
      if (data.result === "success") {
        setRates(data.conversion_rates)
        const date = new Date()
        setLastUpdated(date.toLocaleTimeString(
          locale === "kk" ? "kk-KZ" : locale === "ru" ? "ru-RU" : "en-US"
        ))
      }
    } catch (e) {
      console.error("Rate fetch error:", e)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRates()
  }, [])

  function getKZTRate(currency: string): number {
    if (!rates[currency]) return 0
    return 1 / rates[currency]
  }

  function convert(): string {
    if (!rates[fromCurrency] || !rates[toCurrency]) return "—"
    const amountNum = parseFloat(amount) || 0
    if (fromCurrency === "KZT") {
      return (amountNum * rates[toCurrency]).toFixed(2)
    } else if (toCurrency === "KZT") {
      return (amountNum / rates[fromCurrency]).toFixed(2)
    } else {
      const inKZT = amountNum / rates[fromCurrency]
      return (inKZT * rates[toCurrency]).toFixed(2)
    }
  }

  const allCurrencies = ["KZT", ...BASE_CURRENCIES]

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold">{t(locale, "currency")}</h1>
        <button
          onClick={fetchRates}
          disabled={loading}
          className="ml-auto p-2 rounded-full hover:bg-muted/40 transition-colors"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Конвертер */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">{t(locale, "converter")}</h2>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
              >
                {allCurrencies.map((c) => (
                  <option key={c} value={c}>{CURRENCY_FLAGS[c] ?? "🇰🇿"} {c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <button
                onClick={() => { setFromCurrency(toCurrency); setToCurrency(fromCurrency) }}
                className="p-2 rounded-full border border-border hover:bg-muted/40 transition-colors"
              >
                ⇅
              </button>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex gap-2">
              <div className="flex-1 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 font-mono text-sm font-bold text-primary">
                {loading ? "..." : convert()}
              </div>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
              >
                {allCurrencies.map((c) => (
                  <option key={c} value={c}>{CURRENCY_FLAGS[c] ?? "🇰🇿"} {c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Бағамдар тізімі */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t(locale, "ratesVsKZT")}</p>
            {lastUpdated && (
              <p className="text-[10px] text-muted-foreground">{lastUpdated}</p>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">{t(locale, "loading")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {BASE_CURRENCIES.map((currency) => {
                const rate = getKZTRate(currency)
                return (
                  <div key={currency} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xl">{CURRENCY_FLAGS[currency]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{currency}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {CURRENCY_NAMES[currency]?.[locale as "kk" | "ru" | "en"] ?? currency}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-sm">{rate.toFixed(2)} ₸</p>
                      <p className="text-[10px] text-muted-foreground">1 {currency}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
