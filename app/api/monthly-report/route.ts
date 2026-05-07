import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  // Cron secret тексеру
  const authHeader = req.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Барлық пайдаланушыларды алу
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, locale")

  if (!profiles) return NextResponse.json({ success: true })

  for (const profile of profiles) {
    // Пайдаланушы email-ін алу
    const { data: userData } = await supabase.auth.admin.getUserById(profile.id)
    const email = userData.user?.email
    if (!email) continue

    // Қаржы деректерін алу
    const { data: finances } = await supabase
      .from("finances")
      .select("*")
      .eq("user_id", profile.id)

    if (!finances?.length) continue

    const incomes = finances.filter((f) => f.type === "income")
    const expenses = finances.filter((f) => f.type === "expense")
    const goals = finances.filter((f) => f.type === "goal")

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const savings = Math.max(totalIncome - totalExpenses, 0)
    const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0

    const locale = profile.locale ?? "ru"
    const name = profile.name ?? ""

    // HTML email шаблоны
    const html = generateEmailHTML({ 
      locale, name, totalIncome, totalExpenses, 
      savings, savingsRate, goals, expenses, incomes 
    })

    // Email жіберу
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: email,
        subject: locale === "kk" 
          ? `📊 Unem AI — Ай сайынғы қаржы есебіңіз`
          : locale === "ru"
          ? `📊 Unem AI — Ваш ежемесячный финансовый отчёт`
          : `📊 Unem AI — Your Monthly Financial Report`,
        html,
      }),
    })
  }

  return NextResponse.json({ success: true, processed: profiles.length })
}

function fmt(n: number): string {
  if (!n || n <= 0) return "0 ₸"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

function generateEmailHTML({ 
  locale, name, totalIncome, totalExpenses, 
  savings, savingsRate, goals, expenses, incomes 
}: any): string {
  const titles: Record<string, any> = {
    kk: {
      greeting: `Сәлем, ${name}!`,
      subtitle: "Бұл айдың қаржы есебі",
      income: "Кіріс",
      expenses: "Шығыс",
      savings: "Жинақ",
      savingsRate: "Үнем коэф.",
      topExpenses: "Негізгі шығыстар",
      goals: "Мақсаттар",
      monthsLeft: "ай қалды",
      footer: "Unem AI командасы сізді жақсы қаржылық болашаққа жетелейді! 💪",
      cta: "Толық талдауды көру",
    },
    ru: {
      greeting: `Привет, ${name}!`,
      subtitle: "Финансовый отчёт за этот месяц",
      income: "Доход",
      expenses: "Расходы",
      savings: "Сбережения",
      savingsRate: "Норма сбережений",
      topExpenses: "Основные расходы",
      goals: "Цели",
      monthsLeft: "месяцев осталось",
      footer: "Команда Unem AI помогает вам к лучшему финансовому будущему! 💪",
      cta: "Посмотреть полный анализ",
    },
    en: {
      greeting: `Hi, ${name}!`,
      subtitle: "Your monthly financial report",
      income: "Income",
      expenses: "Expenses",
      savings: "Savings",
      savingsRate: "Savings rate",
      topExpenses: "Top expenses",
      goals: "Goals",
      monthsLeft: "months left",
      footer: "Unem AI team is guiding you to a better financial future! 💪",
      cta: "View full analytics",
    },
  }

  const tx = titles[locale] ?? titles.ru
  const now = new Date()
  const monthName = now.toLocaleDateString(
    locale === "kk" ? "kk-KZ" : locale === "ru" ? "ru-RU" : "en-US",
    { month: "long", year: "numeric" }
  )

  const topExpenses = expenses
    .sort((a: any, b: any) => b.amount - a.amount)
    .slice(0, 5)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:20px;padding:24px;display:inline-block;margin-bottom:16px;">
        <span style="color:white;font-size:32px;font-weight:900;letter-spacing:-1px;">Unem AI</span>
      </div>
      <h1 style="color:white;margin:0;font-size:24px;">${tx.greeting}</h1>
      <p style="color:#9ca3af;margin:8px 0 0;">${tx.subtitle} — ${monthName}</p>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
      <div style="background:#1a1d2e;border:1px solid #2d3148;border-radius:16px;padding:20px;">
        <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">${tx.income}</p>
        <p style="color:#6366f1;font-size:24px;font-weight:700;margin:0;font-family:monospace;">${fmt(totalIncome)}</p>
      </div>
      <div style="background:#1a1d2e;border:1px solid #2d3148;border-radius:16px;padding:20px;">
        <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">${tx.expenses}</p>
        <p style="color:#e5e7eb;font-size:24px;font-weight:700;margin:0;font-family:monospace;">${fmt(totalExpenses)}</p>
      </div>
      <div style="background:#1a1d2e;border:1px solid #2d3148;border-radius:16px;padding:20px;">
        <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">${tx.savings}</p>
        <p style="color:#10b981;font-size:24px;font-weight:700;margin:0;font-family:monospace;">${fmt(savings)}</p>
      </div>
      <div style="background:#1a1d2e;border:1px solid #2d3148;border-radius:16px;padding:20px;">
        <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">${tx.savingsRate}</p>
        <p style="color:#a78bfa;font-size:24px;font-weight:700;margin:0;font-family:monospace;">${savingsRate}%</p>
      </div>
    </div>

    <!-- Top Expenses -->
    ${topExpenses.length > 0 ? `
    <div style="background:#1a1d2e;border:1px solid #2d3148;border-radius:16px;padding:20px;margin-bottom:24px;">
      <h3 style="color:white;margin:0 0 16px;font-size:16px;">${tx.topExpenses}</h3>
      ${topExpenses.map((e: any) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #2d3148;">
          <span style="color:#e5e7eb;font-size:14px;">${e.title}</span>
          <span style="color:#9ca3af;font-family:monospace;font-size:14px;">${fmt(e.amount)}</span>
        </div>
      `).join("")}
    </div>
    ` : ""}

    <!-- Goals -->
    ${goals.length > 0 ? `
    <div style="background:#1a1d2e;border:1px solid #2d3148;border-radius:16px;padding:20px;margin-bottom:24px;">
      <h3 style="color:white;margin:0 0 16px;font-size:16px;">${tx.goals}</h3>
      ${goals.map((g: any) => {
        const months = savings > 0 ? Math.ceil(g.amount / savings) : null
        const progress = savings > 0 ? Math.min((savings / Math.max(g.amount / 12, 1)) * 100, 100) : 0
        return `
        <div style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#e5e7eb;font-size:14px;">${g.title}</span>
            ${months ? `<span style="color:#a78bfa;font-size:12px;">≈ ${months} ${tx.monthsLeft}</span>` : ""}
          </div>
          <div style="background:#2d3148;border-radius:999px;height:6px;">
            <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);height:6px;border-radius:999px;width:${progress}%;"></div>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;font-family:monospace;">${fmt(g.amount)}</p>
        </div>
      `}).join("")}
    </div>
    ` : ""}

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://unem-ai.vercel.app/analytics" 
         style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;font-size:14px;display:inline-block;">
        ${tx.cta} →
      </a>
    </div>

    <!-- Footer -->
    <p style="color:#6b7280;text-align:center;font-size:13px;">${tx.footer}</p>
    <p style="color:#4b5563;text-align:center;font-size:11px;margin-top:16px;">
      Unem AI · unem-ai.vercel.app
    </p>

  </div>
</body>
</html>
  `
}
