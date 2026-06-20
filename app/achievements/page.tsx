"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trophy, Star, Zap } from "lucide-react"
import { useApp } from "@/lib/store"

export default function AchievementsPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const labels = {
    kk: {
      title: "Жетістіктер",
      level: "Деңгей",
      xp: "XP",
      nextLevel: "Келесі деңгейге",
      earned: "Алынған",
      notEarned: "Алынбаған",
      progress: "Прогресс",
    },
    ru: {
      title: "Достижения",
      level: "Уровень",
      xp: "XP",
      nextLevel: "До следующего уровня",
      earned: "Получено",
      notEarned: "Не получено",
      progress: "Прогресс",
    },
    en: {
      title: "Achievements",
      level: "Level",
      xp: "XP",
      nextLevel: "To next level",
      earned: "Earned",
      notEarned: "Not earned",
      progress: "Progress",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-lg font-semibold">{tx.title}</h1>
        </div>
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const earnedTypes = new Set((data?.achievements ?? []).map((a: any) => a.type))

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

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Деңгей карточка */}
        <div className="rounded-2xl bg-gradient-to-br from-primary to-purple-600 p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest">{tx.level}</p>
              <p className="text-4xl font-bold">{data?.level ?? 1}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs uppercase tracking-widest">{tx.xp}</p>
              <p className="text-2xl font-bold">{data?.totalXP ?? 0}</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-white/60 mb-1.5">
              <span>{tx.progress}</span>
              <span>{data?.progress ?? 0}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${data?.progress ?? 0}%` }}
              />
            </div>
            <p className="text-xs text-white/60 mt-1.5">
              {tx.nextLevel}: {(data?.nextLevelXP ?? 500) - (data?.totalXP ?? 0)} XP
            </p>
          </div>
        </div>

        {/* Алынған жетістіктер */}
        {data?.achievements?.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Star className="size-4 text-yellow-400" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {tx.earned} ({data.achievements.length})
              </p>
            </div>
            <div className="divide-y divide-border">
              {data.achievements.map((a: any) => (
                <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-2xl shrink-0">
                    {a.icon ?? "⭐"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {locale === "ru" ? (a.title_ru ?? a.title) : locale === "en" ? (a.title_en ?? a.title) : a.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {locale === "ru" ? (a.description_ru ?? a.description) : locale === "en" ? (a.description_en ?? a.description) : a.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Zap className="size-3" />
                      <span className="text-xs font-bold">+{a.xp} XP</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(a.earned_at).toLocaleDateString(
                        locale === "kk" ? "kk-KZ" : locale === "ru" ? "ru-RU" : "en-US"
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Барлық жетістіктер */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {tx.notEarned} ({(data?.allAchievements ?? []).filter((a: any) => !earnedTypes.has(a.type)).length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {(data?.allAchievements ?? [])
              .filter((a: any) => !earnedTypes.has(a.type))
              .map((a: any) => (
                <div key={a.type} className="px-4 py-3 flex items-center gap-3 opacity-50">
                  <div className="size-12 rounded-2xl bg-muted/30 border border-border flex items-center justify-center text-2xl shrink-0 grayscale">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {locale === "ru" ? a.title_ru : locale === "en" ? a.title_en : a.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {locale === "ru" ? a.description_ru : locale === "en" ? a.description_en : a.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                    <Zap className="size-3" />
                    <span className="text-xs">+{a.xp} XP</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  )
}
