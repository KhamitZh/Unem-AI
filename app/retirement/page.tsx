"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sunset, Calculator } from "lucide-react"
import { useApp } from "@/lib/store"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B ₸`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ₸`
  if (n >= 1_000) return `${Math.round(n).toLocaleString()} ₸`
  return `${Math.round(n)} ₸`
}

export default function RetirementPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale

  const [age, setAge] = useState("30")
  const [retirementAge, setRetirementAge] = useState("63")
  const [salary, setSalary] = useState("")
  const [personalSavings, setPersonalSavings] = useState("")
  const [monthlySavings, setMonthlySavings] = useState("")
  const [result, setResult] = useState<any>(null)

  const ENPF_RATE = 10 // Міндетті зейнет аударымы %
  const ENPF_RETURN = 9.5 // ЕНПФ орташа кірістілік %
  const PERSONAL_RETURN = 14.5 // Жеке депозит кірістілік %

  const labels = {
    kk: {
      title: "Зейнет калькуляторы",
      age: "Қазіргі жасыңыз",
      retirementAge: "Зейнет жасы",
      salary: "Ай сайынғы жалақы (₸)",
      personalSavings: "Қазіргі жинақ (₸)",
      monthlySavings: "Қосымша ай сайынғы жинақ (₸)",
      calculate: "Есептеу",
      result: "Нәтиже",
      yearsLeft: "Зейнетке дейін",
      enpfTotal: "ЕНПФ жинағы",
      personalTotal: "Жеке жинақ",
      totalSavings: "Жалпы жинақ",
      monthlyIncome: "Ай сайынғы кіріс",
      years: "жыл",
      enpfContrib: "ЕНПФ аударымы (10%)",
      tip: "Кеңес",
      yearlyGrowth: "Жылдық өсім",
      enpfInfo: "ЕНПФ туралы",
      enpfInfoText: "Жалақының 10%-ы автоматты ЕНПФ-қа аударылады. Орташа кірістілік ~9.5%/жыл.",
    },
    ru: {
      title: "Пенсионный калькулятор",
      age: "Ваш текущий возраст",
      retirementAge: "Пенсионный возраст",
      salary: "Ежемесячная зарплата (₸)",
      personalSavings: "Текущие сбережения (₸)",
      monthlySavings: "Доп. ежемесячные сбережения (₸)",
      calculate: "Рассчитать",
      result: "Результат",
      yearsLeft: "До пенсии",
      enpfTotal: "Накопления ЕНПФ",
      personalTotal: "Личные сбережения",
      totalSavings: "Итого накоплений",
      monthlyIncome: "Ежемесячный доход",
      years: "лет",
      enpfContrib: "Взнос в ЕНПФ (10%)",
      tip: "Совет",
      yearlyGrowth: "Годовой рост",
      enpfInfo: "О ЕНПФ",
      enpfInfoText: "10% зарплаты автоматически переводится в ЕНПФ. Средняя доходность ~9.5%/год.",
    },
    en: {
      title: "Retirement Calculator",
      age: "Your current age",
      retirementAge: "Retirement age",
      salary: "Monthly salary (₸)",
      personalSavings: "Current savings (₸)",
      monthlySavings: "Additional monthly savings (₸)",
      calculate: "Calculate",
      result: "Result",
      yearsLeft: "Until retirement",
      enpfTotal: "ENPF savings",
      personalTotal: "Personal savings",
      totalSavings: "Total savings",
      monthlyIncome: "Monthly income",
      years: "years",
      enpfContrib: "ENPF contribution (10%)",
      tip: "Tip",
      yearlyGrowth: "Yearly growth",
      enpfInfo: "About ENPF",
      enpfInfoText: "10% of salary is automatically transferred to ENPF. Average return ~9.5%/year.",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  function calculate() {
    const currentAge = Number(age)
    const retAge = Number(retirementAge)
    const sal = Number(salary)
    const personal = Number(personalSavings) || 0
    const monthly = Number(monthlySavings) || 0

    if (!sal || currentAge >= retAge) return

    const yearsLeft = retAge - currentAge
    const monthsLeft = yearsLeft * 12

    const enpfMonthly = sal * (ENPF_RATE / 100)
    const enpfMonthlyRate = ENPF_RETURN / 100 / 12
    const personalMonthlyRate = PERSONAL_RETURN / 100 / 12

    // ЕНПФ жинағы
    let enpfTotal = 0
    for (let m = 0; m < monthsLeft; m++) {
      enpfTotal = enpfTotal * (1 + enpfMonthlyRate) + enpfMonthly
    }

    // Жеке жинақ
    let personalTotal = personal
    for (let m = 0; m < monthsLeft; m++) {
      personalTotal = personalTotal * (1 + personalMonthlyRate) + monthly
    }

    const totalSavings = enpfTotal + personalTotal
    const monthlyIncome = totalSavings / (20 * 12) // 20 жыл өмір сүру болжамы

    // Жылдық кесте
    const chartData = []
    let enpfRunning = 0
    let personalRunning = personal

    for (let yr = 1; yr <= yearsLeft; yr++) {
      for (let m = 0; m < 12; m++) {
        enpfRunning = enpfRunning * (1 + enpfMonthlyRate) + enpfMonthly
        personalRunning = personalRunning * (1 + personalMonthlyRate) + monthly
      }
      chartData.push({
        year: new Date().getFullYear() + yr,
        enpf: Math.round(enpfRunning),
        personal: Math.round(personalRunning),
        total: Math.round(enpfRunning + personalRunning),
      })
    }

    setResult({
      yearsLeft,
      enpfTotal: Math.round(enpfTotal),
      personalTotal: Math.round(personalTotal),
      totalSavings: Math.round(totalSavings),
      monthlyIncome: Math.round(monthlyIncome),
      enpfMonthly: Math.round(enpfMonthly),
      chartData,
    })
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <Sunset className="size-5 text-orange-400" />
          <h1 className="text-lg font-semibold">{tx.title}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* ЕНПФ ақпарат */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3">
          <span className="text-xl shrink-0">ℹ️</span>
          <div>
            <p className="text-xs font-semibold text-blue-400 mb-1">{tx.enpfInfo}</p>
            <p className="text-xs text-muted-foreground">{tx.enpfInfoText}</p>
          </div>
        </div>

        {/* Input */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{tx.age}</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{tx.retirementAge}</label>
              <div className="flex gap-1">
                {[60, 63, 65].map((a) => (
                  <button
                    key={a}
                    onClick={() => setRetirementAge(String(a))}
                    className={`flex-1 rounded-xl py-3 text-xs font-medium transition-colors ${
                      retirementAge === String(a)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.salary}</label>
            <input
              type="number"
              placeholder="350 000"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.personalSavings}</label>
            <input
              type="number"
              placeholder="0"
              value={personalSavings}
              onChange={(e) => setPersonalSavings(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.monthlySavings}</label>
            <input
              type="number"
              placeholder="50 000"
              value={monthlySavings}
              onChange={(e) => setMonthlySavings(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
            />
          </div>

          <button
            onClick={calculate}
            className="w-full rounded-xl bg-gradient-to-r from-orange-400 to-primary text-white py-3 text-sm font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Calculator className="size-4" />
            {tx.calculate}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-4">

            {/* Негізгі нәтиже */}
            <div className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-5 space-y-3">
              <h3 className="font-semibold">
                🌅 {tx.result} — {result.yearsLeft} {tx.years}
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{tx.enpfContrib}</span>
                  <span className="font-mono text-sm">{fmt(result.enpfMonthly)}/ай</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{tx.enpfTotal}</span>
                  <span className="font-mono text-sm text-blue-400">{fmt(result.enpfTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{tx.personalTotal}</span>
                  <span className="font-mono text-sm text-green-500">{fmt(result.personalTotal)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">{tx.totalSavings}</span>
                  <span className="font-mono font-bold text-primary">{fmt(result.totalSavings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">{tx.monthlyIncome}</span>
                  <span className="font-mono font-bold text-orange-400">{fmt(result.monthlyIncome)}/ай</span>
                </div>
              </div>
            </div>

            {/* График */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-4">{tx.yearlyGrowth}</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={result.chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="enpfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="personalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={Math.floor(result.chartData.length / 5)} />
                  <YAxis tickFormatter={(v) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}M` : `${Math.round(v/1000)}k`} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [fmt(value), name === "enpf" ? "ЕНПФ" : name === "personal" ? tx.personalTotal : tx.totalSavings]}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                  />
                  <Legend formatter={(value) => value === "enpf" ? "ЕНПФ" : value === "personal" ? tx.personalTotal : tx.totalSavings} />
                  <Area type="monotone" dataKey="enpf" stroke="#06b6d4" fill="url(#enpfGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="personal" stroke="#10b981" fill="url(#personalGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" fill="url(#totalGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Кеңес */}
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 flex gap-3">
              <span className="text-xl shrink-0">💡</span>
              <div>
                <p className="text-xs font-semibold text-yellow-400 mb-1">{tx.tip}</p>
                <p className="text-xs text-muted-foreground">
                  {locale === "kk"
                    ? `Зейнетте ай сайын ${fmt(result.monthlyIncome)} аласыз. Жеке жинақты арттыру үшін ай сайын қосымша жинаңыз!`
                    : locale === "ru"
                    ? `На пенсии вы будете получать ${fmt(result.monthlyIncome)} в месяц. Увеличьте личные сбережения для большего дохода!`
                    : `In retirement you'll receive ${fmt(result.monthlyIncome)}/month. Increase personal savings for more income!`}
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
