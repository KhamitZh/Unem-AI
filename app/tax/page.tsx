"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calculator, FileText } from "lucide-react"
import { useApp } from "@/lib/store"

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ₸`
  if (n >= 1_000) return `${Math.round(n).toLocaleString()} ₸`
  return `${Math.round(n)} ₸`
}

export default function TaxPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale

  const [income, setIncome] = useState("")
  const [employmentType, setEmploymentType] = useState<"employee" | "individual" | "ip">("employee")
  const [hasPension, setHasPension] = useState(true)
  const [result, setResult] = useState<any>(null)

  const labels = {
    kk: {
      title: "Салық Есептеуіш",
      subtitle: "Қазақстан салық заңнамасы бойынша",
      income: "Жалпы айлық кіріс (₸)",
      employmentType: "Жұмыс түрі",
      employee: "Жалдамалы қызметкер",
      individual: "Жеке тұлға (ГПХ)",
      ip: "Жеке кәсіпкер (ЖК)",
      pension: "БЖЗҚ аударымы (10%)",
      calculate: "Есептеу",
      result: "Нәтиже",
      grossIncome: "Жалпы кіріс",
      pension_contrib: "БЖЗҚ (зейнет)",
      social_contrib: "МЗҚ (медицина)",
      income_tax: "ЖТ (жеке табыс салығы)",
      social_tax: "Әлеуметтік салық",
      net_income: "Таза кіріс (қолда)",
      employer_cost: "Жұмыс берушінің шығыны",
      tip: "Кеңес",
    },
    ru: {
      title: "Налоговый калькулятор",
      subtitle: "По законодательству Казахстана",
      income: "Общий ежемесячный доход (₸)",
      employmentType: "Тип занятости",
      employee: "Наёмный работник",
      individual: "Физическое лицо (ГПХ)",
      ip: "Индивидуальный предприниматель",
      pension: "Взнос в ЕНПФ (10%)",
      calculate: "Рассчитать",
      result: "Результат",
      grossIncome: "Валовый доход",
      pension_contrib: "ЕНПФ (пенсия)",
      social_contrib: "ОСМС (медицина)",
      income_tax: "ИПН (подоходный налог)",
      social_tax: "Социальный налог",
      net_income: "Чистый доход (на руки)",
      employer_cost: "Затраты работодателя",
      tip: "Совет",
    },
    en: {
      title: "Tax Calculator",
      subtitle: "Kazakhstan tax legislation",
      income: "Gross monthly income (₸)",
      employmentType: "Employment type",
      employee: "Employee",
      individual: "Individual (GPC)",
      ip: "Individual Entrepreneur",
      pension: "ENPF contribution (10%)",
      calculate: "Calculate",
      result: "Result",
      grossIncome: "Gross income",
      pension_contrib: "ENPF (pension)",
      social_contrib: "MSMI (medical)",
      income_tax: "IIT (income tax)",
      social_tax: "Social tax",
      net_income: "Net income (take-home)",
      employer_cost: "Employer cost",
      tip: "Tip",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  function calculate() {
    const gross = Number(income)
    if (!gross) return

    const MRP = 3692 // 2024 МРП
    const MIN_WAGE = 85000 // 2024 ең төменгі жалақы

    if (employmentType === "employee") {
      // Жалдамалы қызметкер
      const pension = hasPension ? gross * 0.1 : 0
      const medical = gross * 0.02
      const taxableBase = Math.max(gross - pension - medical - MIN_WAGE, 0)
      const incomeTax = taxableBase * 0.1
      const netIncome = gross - pension - medical - incomeTax

      // Жұмыс берушінің шығыны
      const socialTax = Math.max(gross * 0.095 - gross * 0.02, 0)
      const employerMedical = gross * 0.02
      const employerPension = gross * 0.015
      const totalEmployerCost = gross + socialTax + employerMedical + employerPension

      setResult({
        type: "employee",
        gross,
        pension,
        medical,
        incomeTax,
        netIncome,
        socialTax,
        totalEmployerCost,
        effectiveRate: Math.round(((gross - netIncome) / gross) * 100),
      })
    } else if (employmentType === "individual") {
      // ГПХ — жеке тұлға
      const pension = hasPension ? gross * 0.1 : 0
      const medical = gross * 0.02
      const taxableBase = Math.max(gross - pension - medical - MIN_WAGE, 0)
      const incomeTax = taxableBase * 0.1
      const netIncome = gross - pension - medical - incomeTax

      setResult({
        type: "individual",
        gross,
        pension,
        medical,
        incomeTax,
        netIncome,
        effectiveRate: Math.round(((gross - netIncome) / gross) * 100),
      })
    } else {
      // ЖК — Жеке кәсіпкер (упрощенка)
      const taxRate = 0.03 // 3% упрощенный режим
      const ipTax = gross * taxRate
      const pension = hasPension ? gross * 0.1 : 0
      const medical = gross * 0.02
      const socialContrib = 0.035 * Math.max(gross - pension, 0)
      const netIncome = gross - ipTax - pension - medical - socialContrib

      setResult({
        type: "ip",
        gross,
        ipTax,
        pension,
        medical,
        socialContrib,
        netIncome,
        effectiveRate: Math.round(((gross - netIncome) / gross) * 100),
      })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          <div>
            <h1 className="text-base font-semibold leading-none">{tx.title}</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">{tx.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Input */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.income}</label>
            <input
              type="number"
              placeholder="350 000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{tx.employmentType}</label>
            <div className="space-y-2">
              {[
                { key: "employee", label: tx.employee },
                { key: "individual", label: tx.individual },
                { key: "ip", label: tx.ip },
              ].map((type) => (
                <button
                  key={type.key}
                  onClick={() => setEmploymentType(type.key as any)}
                  className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                    employmentType === type.key
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className={`size-4 rounded-full border-2 flex items-center justify-center ${
                    employmentType === type.key ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {employmentType === type.key && <div className="size-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setHasPension(!hasPension)}
            className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
              hasPension ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <span className="text-sm">{tx.pension}</span>
            <div className={`size-5 rounded-md border-2 flex items-center justify-center transition-colors ${
              hasPension ? "border-primary bg-primary" : "border-muted-foreground"
            }`}>
              {hasPension && <span className="text-white text-xs font-bold">✓</span>}
            </div>
          </button>

          <button
            onClick={calculate}
            disabled={!income}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Calculator className="size-4" />
            {tx.calculate}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">{tx.result}</p>
              </div>
              <div className="divide-y divide-border">
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-muted-foreground">{tx.grossIncome}</span>
                  <span className="font-mono text-sm">{fmt(result.gross)}</span>
                </div>
                {result.pension > 0 && (
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-sm text-muted-foreground">{tx.pension_contrib}</span>
                    <span className="font-mono text-sm text-red-400">-{fmt(result.pension)}</span>
                  </div>
                )}
                {result.medical > 0 && (
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-sm text-muted-foreground">{tx.social_contrib}</span>
                    <span className="font-mono text-sm text-red-400">-{fmt(result.medical)}</span>
                  </div>
                )}
                {result.incomeTax > 0 && (
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-sm text-muted-foreground">{tx.income_tax}</span>
                    <span className="font-mono text-sm text-red-400">-{fmt(result.incomeTax)}</span>
                  </div>
                )}
                {result.ipTax > 0 && (
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-sm text-muted-foreground">ЖК салығы (3%)</span>
                    <span className="font-mono text-sm text-red-400">-{fmt(result.ipTax)}</span>
                  </div>
                )}
                {result.socialContrib > 0 && (
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-sm text-muted-foreground">{tx.social_tax}</span>
                    <span className="font-mono text-sm text-red-400">-{fmt(result.socialContrib)}</span>
                  </div>
                )}
                <div className="px-4 py-4 flex justify-between bg-primary/5">
                  <span className="text-sm font-bold">{tx.net_income}</span>
                  <span className="font-mono font-bold text-primary text-lg">{fmt(result.netIncome)}</span>
                </div>
              </div>
            </div>

            {/* Тиімді салық мөлшерлемесі */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">
                  {locale === "kk" ? "Тиімді салық мөлшерлемесі" : locale === "ru" ? "Эффективная ставка налога" : "Effective tax rate"}
                </p>
                <p className="font-mono font-bold text-red-400">{result.effectiveRate}%</p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-red-400 transition-all" style={{ width: `${result.effectiveRate}%` }} />
              </div>
            </div>

            {/* Жұмыс беруші шығыны */}
            {result.totalEmployerCost && (
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4">
                <p className="text-xs font-semibold text-yellow-400 mb-1">{tx.employer_cost}</p>
                <p className="font-mono font-bold text-yellow-400 text-lg">{fmt(result.totalEmployerCost)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === "kk" ? "Жұмыс беруші сізге жеткізу үшін жалпы жұмсайды" : locale === "ru" ? "Полная стоимость сотрудника для работодателя" : "Total cost of employee for employer"}
                </p>
              </div>
            )}

            {/* Кеңес */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3">
              <span className="text-xl shrink-0">💡</span>
              <div>
                <p className="text-xs font-semibold text-blue-400 mb-1">{tx.tip}</p>
                <p className="text-xs text-muted-foreground">
                  {employmentType === "ip"
                    ? (locale === "kk" ? "ЖК ретінде 3% упрощенный режим — ең қолайлы шағын бизнес үшін. Айналым 24.038 МРП-дан аспаса қолдануға болады." : locale === "ru" ? "Упрощённый режим 3% — оптимален для малого бизнеса. Применяется если оборот не превышает 24 038 МРП." : "Simplified 3% regime is optimal for small business. Applicable if turnover doesn't exceed 24,038 MRP.")
                    : (locale === "kk" ? "Зейнет аударымы 10% міндетті. Бірақ ол сіздің болашақ зейнетіңізге жинақталады!" : locale === "ru" ? "Взнос в ЕНПФ 10% обязателен, но он накапливается для вашей будущей пенсии!" : "ENPF 10% contribution is mandatory, but it accumulates for your future pension!")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
