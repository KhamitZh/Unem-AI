"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Target, Plus, Trash2, TrendingUp, CheckCircle, Clock } from "lucide-react"
import { useApp } from "@/lib/store"

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

export default function GoalTrackerPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [finances, setFinances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [aiAdvice, setAiAdvice] = useState<Record<string, string>>({})
  const [loadingAdvice, setLoadingAdvice] = useState<string | null>(null)

  const labels = {
    kk: {
      title: "AI Мақсат Тренер",
      noGoals: "Мақсат жоқ",
      noGoalsDesc: "Мақсат бетіне өтіп мақсат қосыңыз",
      addGoal: "Мақсат қосу",
      monthsLeft: "ай қалды",
      progress: "Прогресс",
      monthlySavings: "Ай сайынғы жинақ",
      getAdvice: "AI кеңесін алу",
      advice: "AI кеңесі",
      reached: "Жетілді!",
      onTrack: "Жолда",
      behind: "Артта қалды",
    },
    ru: {
      title: "AI Тренер целей",
      noGoals: "Нет целей",
      noGoalsDesc: "Перейдите на страницу целей и добавьте цель",
      addGoal: "Добавить цель",
      monthsLeft: "мес. осталось",
      progress: "Прогресс",
      monthlySavings: "Ежемесячные сбережения",
      getAdvice: "Получить совет AI",
      advice: "Совет AI",
      reached: "Достигнуто!",
      onTrack: "На верном пути",
      behind: "Отстаёте",
    },
    en: {
      title: "AI Goal Tracker",
      noGoals: "No goals",
      noGoalsDesc: "Go to goals page and add a goal",
      addGoal: "Add goal",
      monthsLeft: "months left",
      progress: "Progress",
      monthlySavings: "Monthly savings",
      getAdvice: "Get AI advice",
      advice: "AI advice",
      reached: "Reached!",
      onTrack: "On track",
      behind: "Behind schedule",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  useEffect(() => {
    fetch("/api/finances")
      .then((r) => r.json())
      .then((d) => {
        setFinances(d.finances ?? [])
        setLoading(false)
      })
  }, [])

  const goals = finances.filter((f) => f.type === "goal")
  const incomes = finances.filter((f) => f.type === "income")
  const expenses = finances.filter((f) => f.type === "expense")
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const savings = Math.max(totalIncome - totalExpenses, 0)

  async function getAiAdvice(goal: any) {
    setLoadingAdvice(goal.id)
    const months = savings > 0 ? Math.ceil(goal.amount / savings) : null

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            parts: [{
              type: "text",
              text: `Менің "${goal.title}" мақсатым бар, бағасы ${goal.amount} ₸. Ай сайынғы жинағым ${savings} ₸. ${months ? `Жетуге ${months} ай кетеді.` : "Жинақ жоқ."} Маған осы мақсатқа жетуге 3 нақты практикалық кеңес бер. ${locale === "kk" ? "Қазақша" : locale === "ru" ? "Орысша" : "English"} жаз. Қысқа және нақты болсын.`
            }]
          }],
          context: { locale, estimatedIncome: totalIncome },
        }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue
              try {
                const parsed = JSON.parse(data)
                if (parsed.type === "text-delta") {
                  fullText += parsed.delta
                  setAiAdvice((prev) => ({ ...prev, [goal.id]: fullText }))
                }
              } catch {}
            }
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
    setLoadingAdvice(null)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <Target className="size-5 text-accent" />
          <h1 className="text-lg font-semibold">{tx.title}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Жинақ */}
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-green-500" />
            <span className="text-sm text-muted-foreground">{tx.monthlySavings}</span>
          </div>
          <span className="font-mono font-bold text-green-500">{fmt(savings)}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {locale === "kk" ? "Жүктелуде..." : locale === "ru" ? "Загрузка..." : "Loading..."}
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Target className="size-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">{tx.noGoals}</p>
            <p className="text-sm text-muted-foreground mt-1">{tx.noGoalsDesc}</p>
            <button
              onClick={() => router.push("/finances/goals")}
              className="mt-4 rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:opacity-90 transition"
            >
              {tx.addGoal}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const months = savings > 0 ? Math.ceil(goal.amount / savings) : null
              const progress = savings > 0
                ? Math.min((savings / Math.max(goal.amount / 12, 1)) * 100, 100)
                : 0
              const isReached = progress >= 100
              const isOnTrack = progress >= 50

              return (
                <div key={goal.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{goal.title}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{fmt(goal.amount)}</p>
                      </div>
                      <span className={`shrink-0 text-[10px] px-2 py-1 rounded-full font-medium ${
                        isReached ? "bg-green-500/10 text-green-500" :
                        isOnTrack ? "bg-primary/10 text-primary" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {isReached ? tx.reached : isOnTrack ? tx.onTrack : tx.behind}
                      </span>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>{tx.progress}</span>
                        <span className="font-mono">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isReached ? "bg-green-500" :
                            isOnTrack ? "bg-gradient-to-r from-primary to-accent" :
                            "bg-red-400"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Мерзім */}
                    {months && !isReached && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        <span>≈ {months} {tx.monthsLeft}</span>
                      </div>
                    )}

                    {isReached && (
                      <div className="flex items-center gap-2 text-xs text-green-500">
                        <CheckCircle className="size-3.5" />
                        <span>{tx.reached} 🎉</span>
                      </div>
                    )}

                    {/* AI кеңес батырмасы */}
                    <button
                      onClick={() => getAiAdvice(goal)}
                      disabled={loadingAdvice === goal.id}
                      className="w-full rounded-xl border border-primary/30 bg-primary/5 py-2.5 text-xs font-medium text-primary hover:bg-primary/10 transition disabled:opacity-50"
                    >
                      {loadingAdvice === goal.id
                        ? (locale === "kk" ? "AI ойланып жатыр..." : locale === "ru" ? "AI думает..." : "AI thinking...")
                        : tx.getAdvice}
                    </button>

                    {/* AI кеңесі */}
                    {aiAdvice[goal.id] && (
                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <p className="text-xs font-semibold text-primary mb-2">✨ {tx.advice}</p>
                        <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                          {aiAdvice[goal.id]}
                        </p>
                      </div>
                    )}
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
