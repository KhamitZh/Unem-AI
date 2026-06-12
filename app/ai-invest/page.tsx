"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles, TrendingUp, Shield, Zap } from "lucide-react"
import { useApp } from "@/lib/store"

const RISK_PROFILES = [
  { key: "conservative", kk: "Консервативті", ru: "Консервативный", en: "Conservative", icon: "🛡️", desc_kk: "Тәуекел аз, баяу өсім", desc_ru: "Низкий риск, медленный рост", desc_en: "Low risk, slow growth" },
  { key: "moderate", kk: "Орташа", ru: "Умеренный", en: "Moderate", icon: "⚖️", desc_kk: "Орташа тәуекел мен өсім", desc_ru: "Средний риск и рост", desc_en: "Medium risk and growth" },
  { key: "aggressive", kk: "Агрессивті", ru: "Агрессивный", en: "Aggressive", icon: "🚀", desc_kk: "Жоғары тәуекел, жоғары өсім", desc_ru: "Высокий риск, высокий рост", desc_en: "High risk, high growth" },
]

const INVESTMENT_GOALS = [
  { key: "savings", kk: "Жинақ", ru: "Сбережения", en: "Savings" },
  { key: "retirement", kk: "Зейнет", ru: "Пенсия", en: "Retirement" },
  { key: "property", kk: "Жылжымайтын мүлік", ru: "Недвижимость", en: "Property" },
  { key: "education", kk: "Білім", ru: "Образование", en: "Education" },
  { key: "business", kk: "Бизнес", ru: "Бизнес", en: "Business" },
  { key: "passive", kk: "Пассивті кіріс", ru: "Пассивный доход", en: "Passive income" },
]

export default function AIInvestPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [step, setStep] = useState(1)
  const [riskProfile, setRiskProfile] = useState("")
  const [investGoal, setInvestGoal] = useState("")
  const [monthlyAmount, setMonthlyAmount] = useState("")
  const [horizon, setHorizon] = useState("5")
  const [loading, setLoading] = useState(false)
  const [advice, setAdvice] = useState<string | null>(null)

  const labels = {
    kk: {
      title: "AI Инвестиция Кеңесші",
      step1: "Тәуекел профилі",
      step2: "Инвестиция мақсаты",
      step3: "Сома және мерзім",
      monthlyAmount: "Ай сайынғы инвестиция (₸)",
      horizon: "Инвестиция мерзімі (жыл)",
      generate: "AI кеңес алу",
      generating: "AI талдауда...",
      next: "Келесі",
      back: "Артқа",
      result: "AI Инвестиция Жоспары",
      copy: "Көшіру",
      copied: "Көшірілді!",
    },
    ru: {
      title: "AI Инвестиционный советник",
      step1: "Риск-профиль",
      step2: "Цель инвестиций",
      step3: "Сумма и горизонт",
      monthlyAmount: "Ежемесячная инвестиция (₸)",
      horizon: "Горизонт инвестиций (лет)",
      generate: "Получить совет AI",
      generating: "AI анализирует...",
      next: "Далее",
      back: "Назад",
      result: "AI Инвестиционный план",
      copy: "Копировать",
      copied: "Скопировано!",
    },
    en: {
      title: "AI Investment Advisor",
      step1: "Risk profile",
      step2: "Investment goal",
      step3: "Amount & horizon",
      monthlyAmount: "Monthly investment (₸)",
      horizon: "Investment horizon (years)",
      generate: "Get AI advice",
      generating: "AI analyzing...",
      next: "Next",
      back: "Back",
      result: "AI Investment Plan",
      copy: "Copy",
      copied: "Copied!",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru
  const [copied, setCopied] = useState(false)

  async function generateAdvice() {
    setLoading(true)
    setAdvice(null)

    const prompt = `Сен Қазақстанның жетекші инвестиция кеңесшісісің. Төмендегі профиль бойынша нақты инвестиция жоспарын жаса:

Тәуекел профилі: ${riskProfile}
Мақсат: ${investGoal}
Ай сайынғы сома: ${monthlyAmount} ₸
Мерзім: ${horizon} жыл
Тіл: ${locale === "kk" ? "Қазақша" : locale === "ru" ? "Орысша" : "Ағылшынша"}

Мына форматта жаз:

## 📊 Тәуекел Профилі Талдауы
[Профильді талдау]

## 🎯 Ұсынылатын Портфель
[Нақты пайыздармен бөлу]
- Депозиттер: X%
- Мемлекеттік облигациялар: X%
- KASE акциялары: X%
- ETF/Индекс қорлары: X%
- Крипто (егер сай болса): X%

## 💰 ${horizon} Жылдан Кейін Болжам
[Нақты сандармен]

## 📅 Іс-қимыл Жоспары
### 1-ай:
[Нақты қадамдар]
### 3-ай:
### 6-ай:
### 1-жыл:

## ⚠️ Тәуекелдер
[2-3 негізгі тәуекел]

## ✅ Нақты Ұсыныстар
[Қазақстан нарығына арналған: Kaspi депозиті, Freedom ETF, KASE, т.б.]

Нақты сандармен жаз. Қазақстан реалийлерін ескер.`

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", parts: [{ type: "text", text: prompt }] }],
          context: { locale },
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
                  setAdvice(fullText)
                }
              } catch {}
            }
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function copyAdvice() {
    if (!advice) return
    navigator.clipboard.writeText(advice)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">{tx.title}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${step >= s ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* Step 1 — Тәуекел профилі */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="font-semibold">{tx.step1}</p>
            {RISK_PROFILES.map((rp) => (
              <button
                key={rp.key}
                onClick={() => setRiskProfile(rp.key)}
                className={`w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                  riskProfile === rp.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                <span className="text-3xl">{rp.icon}</span>
                <div>
                  <p className="font-medium">{rp[locale as keyof typeof rp] as string}</p>
                  <p className="text-xs text-muted-foreground">{rp[`desc_${locale}` as keyof typeof rp] as string}</p>
                </div>
              </button>
            ))}
            <button
              onClick={() => setStep(2)}
              disabled={!riskProfile}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {tx.next} →
            </button>
          </div>
        )}

        {/* Step 2 — Мақсат */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="font-semibold">{tx.step2}</p>
            <div className="grid grid-cols-2 gap-2">
              {INVESTMENT_GOALS.map((goal) => (
                <button
                  key={goal.key}
                  onClick={() => setInvestGoal(goal.key)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    investGoal === goal.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="text-sm font-medium">{goal[locale as keyof typeof goal] as string}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-border py-3 text-sm hover:bg-muted/40 transition">
                ← {tx.back}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!investGoal}
                className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {tx.next} →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Сома және мерзім */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="font-semibold">{tx.step3}</p>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{tx.monthlyAmount}</label>
              <input
                type="number"
                placeholder="50 000"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{tx.horizon}</label>
              <div className="flex gap-2">
                {["1", "3", "5", "10", "20"].map((y) => (
                  <button
                    key={y}
                    onClick={() => setHorizon(y)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                      horizon === y ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-border py-3 text-sm hover:bg-muted/40 transition">
                ← {tx.back}
              </button>
              <button
                onClick={generateAdvice}
                disabled={loading || !monthlyAmount}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="size-4" />
                {loading ? tx.generating : tx.generate}
              </button>
            </div>
          </div>
        )}

        {/* AI Кеңес */}
        {advice && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <p className="text-sm font-semibold">{tx.result}</p>
              </div>
              <button onClick={copyAdvice} className="text-xs text-primary hover:opacity-80 transition">
                {copied ? tx.copied : tx.copy}
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{advice}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
