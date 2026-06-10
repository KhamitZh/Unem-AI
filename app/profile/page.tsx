"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Calendar, TrendingUp, TrendingDown, Target, Trophy, Copy, Check, Camera } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

function fmt(n: number): string {
  if (!n || n <= 0) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile, expenses, goals } = useApp()
  const locale = profile.locale
  const [user, setUser] = useState<any>(null)
  const [joinDate, setJoinDate] = useState<string>("")
  const [achievements, setAchievements] = useState<any[]>([])
  const [userNumber, setUserNumber] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dbFinances, setDbFinances] = useState<any[]>([])

  useEffect(() => {
    // Achievements алу
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((d) => setAchievements(d.achievements ?? []))

    // Finances алу
    fetch("/api/finances")
      .then((r) => r.json())
      .then((d) => setDbFinances(d.finances ?? []))
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user?.created_at) {
        const date = new Date(data.user.created_at)
        setJoinDate(date.toLocaleDateString(
          locale === "kk" ? "kk-KZ" : locale === "ru" ? "ru-RU" : "en-US",
          { year: "numeric", month: "long", day: "numeric" }
        ))
      supabase
        .from("profiles")
        .select("user_number, avatar_url")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profileData }) => {
          setUserNumber(profileData?.user_number ?? null)
          setAvatarUrl(profileData?.avatar_url ?? null)
        })
      }

      // User number алу
      if (data.user?.id) {
        supabase
          .from("profiles")
          .select("user_number")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profileData }) => {
            setUserNumber(profileData?.user_number ?? null)
          })
      }
    })
  }, [locale])

  // Finances деректері
  const incomes = dbFinances.filter((f) => f.type === "income")
  const expensesList = dbFinances.filter((f) => f.type === "expense")
  const goalsList = dbFinances.filter((f) => f.type === "goal")

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expensesList.reduce((s, e) => s + e.amount, 0)
  const savings = Math.max(totalIncome - totalExpenses, 0)
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0

  function copyId() {
    if (!userNumber) return
    navigator.clipboard.writeText(String(userNumber))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-full p-2 hover:bg-muted/40 transition-colors"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold">{t(locale, "profileTitle")}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Аватар + Аты + ID */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center text-center">
          {/* Аватар */}
          <div className="relative mb-4">
            <div className="size-20 rounded-full bg-primary/15 flex items-center justify-center text-primary text-3xl font-bold overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
              ) : (
                (profile.name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 size-7 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition"
            >
              {uploadingAvatar
                ? <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Camera className="size-3.5 text-white" />
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploadingAvatar(true)
                const formData = new FormData()
                formData.append("avatar", file)
                const res = await fetch("/api/avatar", { method: "POST", body: formData })
                const data = await res.json()
                if (data.avatarUrl) setAvatarUrl(data.avatarUrl + "?t=" + Date.now())
                setUploadingAvatar(false)
              }}
            />
          </div>
          <h2 className="text-xl font-bold">{profile.name ?? "—"}</h2>
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>

          {/* User ID */}
          {userNumber && (
            <button
              onClick={copyId}
              className="flex items-center gap-2 mt-3 bg-muted/40 hover:bg-muted/60 transition-colors rounded-full px-4 py-1.5"
            >
              <span className="text-xs text-muted-foreground">ID:</span>
              <span className="font-mono text-sm font-bold text-primary">#{userNumber}</span>
              {copied
                ? <Check className="size-3.5 text-green-500" />
                : <Copy className="size-3.5 text-muted-foreground" />
              }
            </button>
          )}

          {joinDate && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              <span>{t(locale, "registered")}: {joinDate}</span>
            </div>
          )}
        </div>

        {/* Қаржы статистикасы */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {t(locale, "financeOverview")}
            </p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-border">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-primary" />
                <span className="text-xs text-muted-foreground">{t(locale, "income")}</span>
              </div>
              <p className="font-mono font-bold text-lg">{fmt(totalIncome)}</p>
              <p className="text-xs text-muted-foreground">{t(locale, "perMonth")}</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="size-4 text-foreground/70" />
                <span className="text-xs text-muted-foreground">{t(locale, "expenses")}</span>
              </div>
              <p className="font-mono font-bold text-lg">{fmt(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground">{t(locale, "perMonth")}</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-green-500" />
                <span className="text-xs text-muted-foreground">{t(locale, "savingsWord")}</span>
              </div>
              <p className="font-mono font-bold text-lg text-primary">{fmt(savings)}</p>
              <p className="text-xs text-muted-foreground">{t(locale, "perMonth")}</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="size-4 text-accent" />
                <span className="text-xs text-muted-foreground">{t(locale, "savingsRate")}</span>
              </div>
              <p className="font-mono font-bold text-lg">{savingsRate}%</p>
              <p className="text-xs text-muted-foreground">{t(locale, "perMonth")}</p>
            </div>
          </div>
        </div>

        {/* Мақсаттар */}
        {goalsList.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t(locale, "goals")}
              </p>
            </div>
            <div className="divide-y divide-border">
              {goalsList.map((g) => {
                const months = savings > 0 ? Math.ceil(g.amount / savings) : null
                return (
                  <div key={g.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{g.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">{fmt(g.amount)}</p>
                    </div>
                    {months && (
                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono font-medium">≈ {months} {t(locale, "months")}</p>
                        <p className="text-xs text-muted-foreground">{t(locale, "timeToGoal")}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Жетістіктер */}
        {achievements.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Trophy className="size-4 text-yellow-400" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {locale === "kk" ? "Жетістіктер" : locale === "ru" ? "Достижения" : "Achievements"}
              </p>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {achievements.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
                  <span className="text-lg">
                    {a.type === "hero" ? "🏆" : a.type === "saver" ? "💰" : "⭐"}
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

        {/* Баптауларға өту */}
        <button
          onClick={() => router.push("/settings")}
          className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <User className="size-4 text-muted-foreground" />
            <span className="text-sm">{t(locale, "goToSettings")}</span>
          </div>
          <ArrowLeft className="size-4 text-muted-foreground rotate-180" />
        </button>

      </div>
    </div>
  )
}
