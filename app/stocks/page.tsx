"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, BarChart2 } from "lucide-react"
import { useApp } from "@/lib/store"

const KASE_STOCKS = [
  { ticker: "KASPI", name: "Kaspi.kz", name_ru: "Kaspi.kz", sector: "Технологии", color: "#f59e0b" },
  { ticker: "HSBK", name: "Halyk Bank", name_ru: "Халык Банк", sector: "Банк", color: "#10b981" },
  { ticker: "KZTK", name: "Казтелеком", name_ru: "Казтелеком", sector: "Телеком", color: "#6366f1" },
  { ticker: "KEGC", name: "КЕГОК", name_ru: "КЕГОК", sector: "Энергетика", color: "#f97316" },
  { ticker: "BAST", name: "Казмунайгаз", name_ru: "КазМунайГаз", sector: "Нефть", color: "#84cc16" },
  { ticker: "KCELL", name: "Kcell", name_ru: "Kcell", sector: "Телеком", color: "#06b6d4" },
  { ticker: "KBAL", name: "Казахалтын", name_ru: "Казахалтын", sector: "Металлы", color: "#fbbf24" },
  { ticker: "HRDN", name: "Корпорация Казахмыс", name_ru: "Казахмыс", sector: "Металлы", color: "#8b5cf6" },
]

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ₸`
  if (n >= 1_000) return `${n.toLocaleString()} ₸`
  return `${n} ₸`
}

export default function StocksPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [portfolio, setPortfolio] = useState<Record<string, number>>({})
  const [showAddPortfolio, setShowAddPortfolio] = useState<string | null>(null)
  const [addShares, setAddShares] = useState("")

  const labels = {
    kk: {
      title: "KASE Қор Нарығы",
      subtitle: "Қазақстан қор биржасы",
      price: "Баға",
      change: "Өзгеріс",
      volume: "Көлем",
      portfolio: "Портфелім",
      addToPortfolio: "Портфельге қосу",
      shares: "Акция саны",
      add: "Қосу",
      cancel: "Болдырмау",
      totalValue: "Портфель құны",
      noPortfolio: "Портфель бос",
      refreshing: "Жаңартылуда...",
      sector: "Сектор",
    },
    ru: {
      title: "Рынок KASE",
      subtitle: "Казахстанская фондовая биржа",
      price: "Цена",
      change: "Изменение",
      volume: "Объём",
      portfolio: "Мой портфель",
      addToPortfolio: "В портфель",
      shares: "Количество акций",
      add: "Добавить",
      cancel: "Отмена",
      totalValue: "Стоимость портфеля",
      noPortfolio: "Портфель пуст",
      refreshing: "Обновление...",
      sector: "Сектор",
    },
    en: {
      title: "KASE Stock Market",
      subtitle: "Kazakhstan Stock Exchange",
      price: "Price",
      change: "Change",
      volume: "Volume",
      portfolio: "My Portfolio",
      addToPortfolio: "Add to portfolio",
      shares: "Number of shares",
      add: "Add",
      cancel: "Cancel",
      totalValue: "Portfolio value",
      noPortfolio: "Portfolio is empty",
      refreshing: "Refreshing...",
      sector: "Sector",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  useEffect(() => {
    loadStocks()
    const saved = localStorage.getItem("unemai_portfolio")
    if (saved) setPortfolio(JSON.parse(saved))
  }, [])

  async function loadStocks() {
    setLoading(true)
    try {
      // Simulated KASE data (нақты API жоқ болғандықтан)
      const simulated = KASE_STOCKS.map((s) => {
        const basePrice = Math.random() * 50000 + 5000
        const change = (Math.random() - 0.5) * 10
        return {
          ...s,
          price: Math.round(basePrice),
          change: parseFloat(change.toFixed(2)),
          volume: Math.round(Math.random() * 1000000),
          marketCap: Math.round(basePrice * Math.random() * 1000000),
        }
      })
      setStocks(simulated)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function addToPortfolio(ticker: string) {
    const shares = Number(addShares)
    if (!shares || shares <= 0) return
    const newPortfolio = { ...portfolio, [ticker]: (portfolio[ticker] ?? 0) + shares }
    setPortfolio(newPortfolio)
    localStorage.setItem("unemai_portfolio", JSON.stringify(newPortfolio))
    setShowAddPortfolio(null)
    setAddShares("")
  }

  const portfolioValue = stocks.reduce((total, stock) => {
    const shares = portfolio[stock.ticker] ?? 0
    return total + shares * stock.price
  }, 0)

  const portfolioItems = stocks.filter((s) => (portfolio[s.ticker] ?? 0) > 0)

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <BarChart2 className="size-5 text-primary" />
          <div>
            <h1 className="text-base font-semibold leading-none">{tx.title}</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">{tx.subtitle}</p>
          </div>
        </div>
        <button onClick={loadStocks} disabled={loading} className="ml-auto p-2 rounded-full hover:bg-muted/40 transition-colors">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Портфель */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{tx.portfolio}</p>
            {portfolioValue > 0 && (
              <p className="font-mono font-bold text-sm text-primary">{fmt(portfolioValue)}</p>
            )}
          </div>
          {portfolioItems.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6">{tx.noPortfolio}</p>
          ) : (
            <div className="divide-y divide-border">
              {portfolioItems.map((stock) => (
                <div key={stock.ticker} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: stock.color }}>
                      {stock.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{stock.ticker}</p>
                      <p className="text-[10px] text-muted-foreground">{portfolio[stock.ticker]} акция</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold">{fmt(portfolio[stock.ticker] * stock.price)}</p>
                    <p className={`text-[10px] font-mono ${stock.change >= 0 ? "text-green-500" : "text-red-400"}`}>
                      {stock.change >= 0 ? "+" : ""}{stock.change}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Акциялар тізімі */}
        <div className="space-y-2">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {locale === "kk" ? "Жүктелуде..." : locale === "ru" ? "Загрузка..." : "Loading..."}
            </div>
          ) : (
            stocks.map((stock) => (
              <div key={stock.ticker} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div
                    className="size-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: stock.color + "cc" }}
                  >
                    {stock.ticker.slice(0, 3)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{stock.ticker}</p>
                      <p className="font-mono font-bold text-sm">{fmt(stock.price)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">
                        {locale === "ru" ? stock.name_ru : stock.name} · {stock.sector}
                      </p>
                      <div className={`flex items-center gap-1 text-xs font-mono font-medium ${
                        stock.change >= 0 ? "text-green-500" : "text-red-400"
                      }`}>
                        {stock.change >= 0
                          ? <TrendingUp className="size-3" />
                          : <TrendingDown className="size-3" />
                        }
                        {stock.change >= 0 ? "+" : ""}{stock.change}%
                      </div>
                    </div>
                  </div>
                </div>

                {showAddPortfolio === stock.ticker ? (
                  <div className="px-4 pb-4 border-t border-border pt-3 flex gap-2">
                    <input
                      type="number"
                      placeholder={tx.shares}
                      value={addShares}
                      onChange={(e) => setAddShares(e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                    />
                    <button
                      onClick={() => addToPortfolio(stock.ticker)}
                      className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-medium hover:opacity-90 transition"
                    >
                      {tx.add}
                    </button>
                    <button
                      onClick={() => setShowAddPortfolio(null)}
                      className="rounded-xl border border-border px-3 py-2 text-xs hover:bg-muted/40 transition"
                    >
                      {tx.cancel}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddPortfolio(stock.ticker)}
                    className="w-full border-t border-border py-2 text-xs text-primary hover:bg-primary/5 transition-colors"
                  >
                    + {tx.addToPortfolio}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
