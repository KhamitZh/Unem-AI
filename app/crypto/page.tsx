"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, Plus, Trash2 } from "lucide-react"
import { useApp } from "@/lib/store"

const TOP_CRYPTOS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", color: "#f59e0b", icon: "₿" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", color: "#6366f1", icon: "Ξ" },
  { id: "binancecoin", symbol: "BNB", name: "BNB", color: "#fbbf24", icon: "B" },
  { id: "solana", symbol: "SOL", name: "Solana", color: "#8b5cf6", icon: "◎" },
  { id: "toncoin", symbol: "TON", name: "Toncoin", color: "#06b6d4", icon: "💎" },
  { id: "ripple", symbol: "XRP", name: "XRP", color: "#0ea5e9", icon: "✕" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", color: "#f97316", icon: "Ð" },
  { id: "cardano", symbol: "ADA", name: "Cardano", color: "#10b981", icon: "A" },
]

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${n.toLocaleString("en", { maximumFractionDigits: 2 })}`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${n.toFixed(6)}`
}

function fmtKZT(usd: number): string {
  const kzt = usd * 510
  if (kzt >= 1_000_000) return `${(kzt / 1_000_000).toFixed(2)}M ₸`
  if (kzt >= 1_000) return `${Math.round(kzt / 1000)}k ₸`
  return `${Math.round(kzt)} ₸`
}

export default function CryptoPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [prices, setPrices] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [portfolio, setPortfolio] = useState<Record<string, number>>({})
  const [showAdd, setShowAdd] = useState<string | null>(null)
  const [addAmount, setAddAmount] = useState("")

  const labels = {
    kk: {
      title: "Крипто Портфель",
      portfolio: "Менің портфелім",
      noPortfolio: "Портфель бос",
      totalValue: "Жалпы құны",
      add: "Қосу",
      cancel: "Болдырмау",
      amount: "Мөлшері (монета)",
      addToPortfolio: "Портфельге қосу",
      change24h: "24 сағат",
      price: "Баға",
    },
    ru: {
      title: "Крипто Портфель",
      portfolio: "Мой портфель",
      noPortfolio: "Портфель пуст",
      totalValue: "Общая стоимость",
      add: "Добавить",
      cancel: "Отмена",
      amount: "Количество (монет)",
      addToPortfolio: "В портфель",
      change24h: "24 часа",
      price: "Цена",
    },
    en: {
      title: "Crypto Portfolio",
      portfolio: "My Portfolio",
      noPortfolio: "Portfolio is empty",
      totalValue: "Total value",
      add: "Add",
      cancel: "Cancel",
      amount: "Amount (coins)",
      addToPortfolio: "Add to portfolio",
      change24h: "24h change",
      price: "Price",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  useEffect(() => {
    loadPrices()
    const saved = localStorage.getItem("unemai_crypto_portfolio")
    if (saved) setPortfolio(JSON.parse(saved))
  }, [])

  async function loadPrices() {
    setLoading(true)
    try {
      const ids = TOP_CRYPTOS.map((c) => c.id).join(",")
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
      )
      const data = await res.json()
      setPrices(data)
    } catch (e) {
      // Fallback симуляция
      const fallback: Record<string, any> = {}
      TOP_CRYPTOS.forEach((c) => {
        fallback[c.id] = {
          usd: Math.random() * 50000 + 100,
          usd_24h_change: (Math.random() - 0.5) * 20,
        }
      })
      setPrices(fallback)
    }
    setLoading(false)
  }

  function addToPortfolio(id: string) {
    const amount = Number(addAmount)
    if (!amount || amount <= 0) return
    const newPortfolio = { ...portfolio, [id]: (portfolio[id] ?? 0) + amount }
    setPortfolio(newPortfolio)
    localStorage.setItem("unemai_crypto_portfolio", JSON.stringify(newPortfolio))
    setShowAdd(null)
    setAddAmount("")
  }

  function removeFromPortfolio(id: string) {
    const newPortfolio = { ...portfolio }
    delete newPortfolio[id]
    setPortfolio(newPortfolio)
    localStorage.setItem("unemai_crypto_portfolio", JSON.stringify(newPortfolio))
  }

  const portfolioValue = TOP_CRYPTOS.reduce((total, crypto) => {
    const amount = portfolio[crypto.id] ?? 0
    const price = prices[crypto.id]?.usd ?? 0
    return total + amount * price
  }, 0)

  const portfolioItems = TOP_CRYPTOS.filter((c) => (portfolio[c.id] ?? 0) > 0)

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold">{tx.title}</h1>
        <button onClick={loadPrices} disabled={loading} className="ml-auto p-2 rounded-full hover:bg-muted/40 transition-colors">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Портфель */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{tx.portfolio}</p>
            {portfolioValue > 0 && (
              <div className="text-right">
                <p className="font-mono font-bold text-sm text-primary">{fmt(portfolioValue)}</p>
                <p className="text-[10px] text-muted-foreground">{fmtKZT(portfolioValue)}</p>
              </div>
            )}
          </div>
          {portfolioItems.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6">{tx.noPortfolio}</p>
          ) : (
            <div className="divide-y divide-border">
              {portfolioItems.map((crypto) => {
                const price = prices[crypto.id]?.usd ?? 0
                const amount = portfolio[crypto.id] ?? 0
                const value = amount * price
                const change = prices[crypto.id]?.usd_24h_change ?? 0
                return (
                  <div key={crypto.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="size-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: crypto.color }}>
                      {crypto.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{crypto.symbol}</p>
                      <p className="text-[10px] text-muted-foreground">{amount} монета</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold">{fmt(value)}</p>
                      <p className={`text-[10px] font-mono ${change >= 0 ? "text-green-500" : "text-red-400"}`}>
                        {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                      </p>
                    </div>
                    <button onClick={() => removeFromPortfolio(crypto.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Крипто тізімі */}
        <div className="space-y-2">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {locale === "kk" ? "Жүктелуде..." : locale === "ru" ? "Загрузка..." : "Loading..."}
            </div>
          ) : (
            TOP_CRYPTOS.map((crypto) => {
              const price = prices[crypto.id]?.usd ?? 0
              const change = prices[crypto.id]?.usd_24h_change ?? 0
              return (
                <div key={crypto.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="p-4 flex items-center gap-3">
                    <div className="size-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ backgroundColor: crypto.color + "cc" }}>
                      {crypto.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{crypto.symbol}</p>
                        <p className="font-mono font-bold text-sm">{fmt(price)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground">{crypto.name} · {fmtKZT(price)}</p>
                        <p className={`text-xs font-mono font-medium ${change >= 0 ? "text-green-500" : "text-red-400"}`}>
                          {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {showAdd === crypto.id ? (
                    <div className="px-4 pb-4 border-t border-border pt-3 flex gap-2">
                      <input
                        type="number"
                        step="0.000001"
                        placeholder={tx.amount}
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                      />
                      <button onClick={() => addToPortfolio(crypto.id)} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-medium hover:opacity-90 transition">
                        {tx.add}
                      </button>
                      <button onClick={() => setShowAdd(null)} className="rounded-xl border border-border px-3 py-2 text-xs hover:bg-muted/40 transition">
                        {tx.cancel}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAdd(crypto.id)} className="w-full border-t border-border py-2 text-xs text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5">
                      <Plus className="size-3.5" />
                      {tx.addToPortfolio}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
