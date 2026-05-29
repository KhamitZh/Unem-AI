"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles, Download, Target, TrendingUp, Shield } from "lucide-react"
import { useApp } from "@/lib/store"

export default function FinancialPlanPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale

  const [income, setIncome] = useState("")
  const [expenses, setExpenses] = useState("")
  const [goal, setGoal] = useState("")
  const [goalAmount, setGoalAmount] = useState("")
  const [planYears, setPlanYears] = useState("3")
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)

  const labels = {
    kk: {
      title: "AI Қаржылық Жоспар",
      subtitle: "AI сіздің жағдайыңызға арнап жоспар жасайды",
      income: "Ай сайынғы кіріс (₸)",
      expenses: "Ай сайынғы шығыс (₸)",
      goal: "Негізгі мақсатыңыз",
      goalAmount: "Мақсат сомасы (₸)",
      years: "Жоспар мерзімі",
      generate: "Жоспар жасау",
      generating: "Жоспар жасалуда...",
      goalExamples: ["Үй сатып алу", "Кәсіп ашу", "Зейнет", "Баланы оқыту", "Шетелге шығу"],
      copy: "Көшіру",
      copied: "Көшірілді!",
    },
    ru: {
      title: "AI Финансовый план",
      subtitle: "AI составит план специально для вашей ситуации",
      income: "Ежемесячный доход (₸)",
      expenses: "Ежемесячные расходы (₸)",
      goal: "Ваша главная цель",
      goalAmount: "Сумма цели (₸)",
      years: "Срок плана",
      generate: "Создать план",
      generating: "Создание плана...",
      goalExamples: ["Купить жилье", "Открыть бизнес", "Пенсия", "Образование детей", "Поездка за рубеж"],
      copy: "Копировать",
      copied: "Скопировано!",
    },
    en: {
      title: "AI Financial Plan",
      subtitle: "AI will create a plan tailored to your situation",
      income: "Monthly income (₸)",
      expenses: "Monthly expenses (₸)",
      goal: "Your main goal",
      goalAmount: "Goal amount (₸)",
      years: "Plan duration",
      generate: "Generate plan",
      generating: "Generating plan...",
      goalExamples: ["Buy a home", "Start a business", "Retirement", "Children's education", "Travel abroad"],
      copy: "Copy",
      copied: "Copied!",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  const [copied, setCopied] = useState(false)

  async function generatePlan() {
    if (!income || !expenses) return
    setLoading(true)
    setPlan(null)

    const prompt = `Сен қаржылық жоспаршысың. Пайдаланушы үшін ${planYears} жылдық нақты қаржылық жоспар жаса.

Деректер:
- Ай сайынғы кіріс: ${income} ₸
- Ай сайынғы шығыс: ${expenses} ₸
- Жинақ: ${Math.max(Number(income) - Number(expenses), 0)} ₸/ай
- Негізгі мақсат: ${goal || "жинақ жасау"}
- Мақсат сомасы: ${goalAmount || "белгісіз"} ₸
- Жоспар мерзімі: ${planYears} жыл

Мына форматта жаз (${locale === "kk" ? "қазақша" : locale === "ru" ? "орысша" : "ағылшынша"}):

## 📊 Қазіргі жағдай талдауы
[Кіріс/шығыс/жинақ талдауы]

## 🎯 Мақсатқа жету жоспары
[Ай сайын қанша жинау керек, қашан жетеді]

## 📅 ${planYears} жылдық кезең-кезең жоспары

### 1-жыл мақсаттары:
[3-5 нақты қадам]

### 2-жыл мақсаттары:
[3-5 нақты қадам]

${planYears === "3" ? `### 3-жыл мақсаттары:\n[3-5 нақты қадам]` : ""}

## 💰 Инвестиция ұсынысы
[Жинақты қайда салу керек - депозит, акция, ETF]

## ⚠️ Тәуекелдер мен шешімдер
[2-3 негізгі тәуекел және шешімі]

## ✅ Маңызды кеңестер
[3-5 практикалық кеңес]

Нақты сандармен жаз. Қазақстан реалийлерін ескер (теңге, Kaspi, ЕНПФ, KASE).`

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", parts: [{ type: "text", text: prompt }] }],
          context: {
            locale,
            estimatedIncome: Number(income),
            expenses: [{ category: "жалпы шығыс", amount: Number(expenses) }],
          },
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
                  setPlan(fullText)
                }
              } catch {}
            }
          }
        }
      }
    } catch (e) {
      console.error("Plan error:", e)
    }
    setLoading(false)
  }

  function copyPlan() {
    if (!plan) return
    navigator.clipboard.writeText(plan)
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

        <p className="text-sm text-muted-foreground text-center">{tx.subtitle}</p>

        {/* Input */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{tx.income}</label>
              <input
                type="number"
                placeholder="350 000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{tx.expenses}</label>
              <input
                type="number"
                placeholder="250 000"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.goal}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tx.goalExamples.map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    goal === g ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder={tx.goal}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{tx.goalAmount}</label>
              <input
                type="number"
                placeholder="25 000 000"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{tx.years}</label>
              <div className="flex gap-1">
                {["1", "3", "5"].map((y) => (
                  <button
                    key={y}
                    onClick={() => setPlanYears(y)}
                    className={`flex-1 rounded-xl py-3 text-xs font-medium transition-colors ${
                      planYears === y ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {y} жыл
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={generatePlan}
            disabled={loading || !income || !expenses}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="size-4" />
            {loading ? tx.generating : tx.generate}
          </button>
        </div>

        {/* Жоспар */}
        {plan && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold">📋 {planYears} жылдық жоспар</p>
              <button
                onClick={copyPlan}
                className="text-xs text-primary hover:opacity-80 transition"
              >
                {copied ? tx.copied : tx.copy}
              </button>
            </div>
            <div className="p-4 prose prose-sm max-w-none">
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {plan}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
