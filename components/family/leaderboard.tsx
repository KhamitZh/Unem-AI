"use client"

import { useEffect, useState } from "react"
import { Trophy, Medal, Star, Crown, Flame } from "lucide-react"
import { useApp } from "@/lib/store"

interface Member {
  user_id: string
  name: string
  savings: number
  totalIncome: number
  totalExpenses: number
  role: string
}

function fmt(n: number): string {
  if (!n || n <= 0) return "0 ₸"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

const RANK_ICONS = [
  { icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { icon: Medal, color: "text-gray-400", bg: "bg-gray-400/10" },
  { icon: Medal, color: "text-amber-600", bg: "bg-amber-600/10" },
]

const BADGES = [
  { type: "hero", icon: "🏆", label: { kk: "Ай қаһарманы", ru: "Герой месяца", en: "Hero of the month" } },
  { type: "saver", icon: "💰", label: { kk: "Үнемші", ru: "Экономный", en: "Saver" } },
  { type: "consistent", icon: "🔥", label: { kk: "Тұрақты", ru: "Стабильный", en: "Consistent" } },
]

export function Leaderboard({ members, currentUserId }: { members: Member[], currentUserId: string }) {
  const { profile } = useApp()
  const locale = profile.locale
  const [achievements, setAchievements] = useState<any[]>([])

  const sorted = [...members].sort((a, b) => b.savings - a.savings)
  const hero = sorted[0]

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((d) => setAchievements(d.achievements ?? []))

    // Ай қаһарманын тағайындау
    if (hero && hero.savings > 0) {
      fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hero",
          title: locale === "kk" ? "Ай қаһарманы" : locale === "ru" ? "Герой месяца" : "Hero of the month",
          description: `${fmt(hero.savings)} ${locale === "kk" ? "жинады" : locale === "ru" ? "сбережений" : "saved"}`,
          month,
          targetUserId: hero.user_id,
        }),
      })
    }

    // Үнемші badge — 30%+ жинаған
    members.forEach((m) => {
      if (m.totalIncome > 0 && m.savings / m.totalIncome >= 0.3) {
        fetch("/api/achievements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "saver",
            title: locale === "kk" ? "Үнемші" : locale === "ru" ? "Экономный" : "Super Saver",
            description: locale === "kk" ? "Кірістің 30%+ үнемдеді" : locale === "ru" ? "Сэкономил 30%+ дохода" : "Saved 30%+ of income",
            month,
            targetUserId: m.user_id,
          }),
        })
      }
    })
  }, [hero?.user_id])

  const labels = {
    kk: { leaderboard: "Лидерлер", savings: "Жинақ", badge: "Жетістіктер" },
    ru: { leaderboard: "Лидеры", savings: "Сбережения", badge: "Достижения" },
    en: { leaderboard: "Leaderboard", savings: "Savings", badge: "Achievements" },
  }
  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  return (
    <div className="space-y-3">

      {/* Leaderboard */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Trophy className="size-4 text-yellow-400" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{tx.leaderboard}</p>
        </div>

        <div className="divide-y divide-border">
          {sorted.map((member, index) => {
            const rankConfig = RANK_ICONS[index] ?? { icon: Star, color: "text-muted-foreground", bg: "bg-muted/30" }
            const RankIcon = rankConfig.icon
            const isMe = member.user_id === currentUserId
            const isHero = index === 0 && member.savings > 0

            return (
              <div
                key={member.user_id}
                className={`px-4 py-3 flex items-center gap-3 ${isMe ? "bg-primary/5" : ""}`}
              >
                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${rankConfig.bg}`}>
                  <RankIcon className={`size-4 ${rankConfig.color}`} />
                </div>

                <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold shrink-0">
                  {(member.name?.[0] ?? "?").toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm truncate">{member.name}</p>
                    {isHero && <span className="text-sm">🏆</span>}
                    {isMe && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">You</span>}
                    {member.role === "admin" && <Crown className="size-3 text-yellow-400" />}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {member.totalIncome > 0 && member.savings / member.totalIncome >= 0.3 && (
                      <span className="text-xs">💰</span>
                    )}
                    {member.savings > 0 && <Flame className="size-3 text-orange-400" />}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-sm text-green-500">{fmt(member.savings)}</p>
                  <p className="text-[10px] text-muted-foreground">{tx.savings}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Жетістіктер */}
      {achievements.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Star className="size-4 text-accent" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{tx.badge}</p>
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {achievements.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2"
              >
                <span className="text-lg">
                  {BADGES.find((b) => b.type === a.type)?.icon ?? "⭐"}
                </span>
                <div>
                  <p className="text-xs font-medium">{a.title}</p>
                  {a.description && <p className="text-[10px] text-muted-foreground">{a.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
