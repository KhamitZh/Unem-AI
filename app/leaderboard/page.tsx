"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trophy, Medal, Star, TrendingUp, Crown } from "lucide-react"
import { useApp } from "@/lib/store"

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

const RANK_CONFIG = [
  { icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "🥇" },
  { icon: Medal, color: "text-gray-400", bg: "bg-gray-400/10", label: "🥈" },
  { icon: Medal, color: "text-amber-600", bg: "bg-amber-600/10", label: "🥉" },
]

export default function LeaderboardPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState<any>(null)
  const [period, setPeriod] = useState<"month" | "all">("month")

  const labels = {
    kk: {
      title: "Лидерлер кестесі",
      subtitle: "Ең көп жинаған қолданушылар",
      month: "Осы ай",
      allTime: "Барлық уақыт",
      savings: "Жинақ",
      rank: "Орын",
      yourRank: "Сіздің орныңыз",
      noData: "Деректер жоқ",
      anonymous: "Анонимді",
      tip: "Жинақ жасаңыз — лидерлер кестесіне шығыңыз!",
    },
    ru: {
      title: "Таблица лидеров",
      subtitle: "Пользователи с наибольшими сбережениями",
      month: "Этот месяц",
      allTime: "Все время",
      savings: "Сбережения",
      rank: "Место",
      yourRank: "Ваше место",
      noData: "Нет данных",
      anonymous: "Аноним",
      tip: "Копите деньги — попадите в таблицу лидеров!",
    },
    en: {
      title: "Leaderboard",
      subtitle: "Users with the most savings",
      month: "This month",
      allTime: "All time",
      savings: "Savings",
      rank: "Rank",
      yourRank: "Your rank",
      noData: "No data",
      anonymous: "Anonymous",
      tip: "Save money — get on the leaderboard!",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  useEffect(() => {
    loadLeaderboard()
  }, [period])

  async function loadLeaderboard() {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?period=${period}`)
      const data = await res.json()
      setLeaders(data.leaders ?? [])
      setMyRank(data.myRank)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-yellow-400" />
          <h1 className="text-lg font-semibold">{tx.title}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        <p className="text-sm text-muted-foreground text-center">{tx.subtitle}</p>

        {/* Period selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPeriod("month")}
            className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
              period === "month" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
            }`}
          >
            {tx.month}
          </button>
          <button
            onClick={() => setPeriod("all")}
            className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
              period === "all" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
            }`}
          >
            {tx.allTime}
          </button>
        </div>

        {/* Top 3 */}
        {!loading && leaders.length >= 3 && (
          <div className="grid grid-cols-3 gap-3">
            {/* 2-орын */}
            <div className="rounded-2xl border border-gray-400/20 bg-gray-400/5 p-3 text-center flex flex-col items-center gap-2 mt-6">
              <div className="size-12 rounded-full bg-gray-400/20 flex items-center justify-center text-xl font-bold text-gray-400">
                {(leaders[1]?.name?.[0] ?? "?").toUpperCase()}
              </div>
              <span className="text-lg">🥈</span>
              <p className="text-xs font-medium truncate w-full text-center">{leaders[1]?.name ?? tx.anonymous}</p>
              <p className="text-xs font-mono text-gray-400">{fmt(leaders[1]?.savings ?? 0)}</p>
            </div>

            {/* 1-орын */}
            <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3 text-center flex flex-col items-center gap-2 shadow-lg shadow-yellow-400/10">
              <Crown className="size-5 text-yellow-400" />
              <div className="size-14 rounded-full bg-yellow-400/20 flex items-center justify-center text-2xl font-bold text-yellow-400">
                {(leaders[0]?.name?.[0] ?? "?").toUpperCase()}
              </div>
              <span className="text-lg">🥇</span>
              <p className="text-xs font-medium truncate w-full text-center">{leaders[0]?.name ?? tx.anonymous}</p>
              <p className="text-xs font-mono text-yellow-400">{fmt(leaders[0]?.savings ?? 0)}</p>
            </div>

            {/* 3-орын */}
            <div className="rounded-2xl border border-amber-600/20 bg-amber-600/5 p-3 text-center flex flex-col items-center gap-2 mt-6">
              <div className="size-12 rounded-full bg-amber-600/20 flex items-center justify-center text-xl font-bold text-amber-600">
                {(leaders[2]?.name?.[0] ?? "?").toUpperCase()}
              </div>
              <span className="text-lg">🥉</span>
              <p className="text-xs font-medium truncate w-full text-center">{leaders[2]?.name ?? tx.anonymous}</p>
              <p className="text-xs font-mono text-amber-600">{fmt(leaders[2]?.savings ?? 0)}</p>
            </div>
          </div>
        )}

        {/* Толық тізім */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{tx.rank}</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {locale === "kk" ? "Жүктелуде..." : locale === "ru" ? "Загрузка..." : "Loading..."}
            </div>
          ) : leaders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">{tx.noData}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leaders.map((leader, i) => {
                const rankConfig = RANK_CONFIG[i]
                const isMe = leader.isMe

                return (
                  <div
                    key={leader.id}
                    className={`px-4 py-3 flex items-center gap-3 ${isMe ? "bg-primary/5" : ""}`}
                  >
                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                      rankConfig ? rankConfig.bg + " " + rankConfig.color : "bg-muted/30 text-muted-foreground"
                    }`}>
                      {i < 3 ? rankConfig.label : i + 1}
                    </div>

                    <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold shrink-0">
                      {(leader.name?.[0] ?? "?").toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm truncate">{leader.name ?? tx.anonymous}</p>
                        {isMe && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">You</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-sm text-green-500">{fmt(leader.savings)}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.savings}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Менің орным */}
        {myRank && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {myRank.rank}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{tx.yourRank}</p>
              <p className="font-mono font-bold text-primary">{fmt(myRank.savings)}</p>
            </div>
            <TrendingUp className="size-5 text-primary ml-auto" />
          </div>
        )}

        {/* Кеңес */}
        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 flex gap-3">
          <Star className="size-5 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">{tx.tip}</p>
        </div>

      </div>
    </div>
  )
}
