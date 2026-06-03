import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const CRON_SECRET = process.env.CRON_SECRET!

async function sendMessage(chatId: string, text: string, keyboard?: any) {
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  }
  if (keyboard) body.reply_markup = keyboard

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { type } = await req.json()
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

  if (type === "daily") {
    // Күнделікті хабарлама — барлық Telegram пайдаланушыларға
    const { data: telegramUsers } = await supabase
      .from("telegram_users")
      .select("*, profiles(name, locale), telegram_notifications(daily_reminder)")

    let sent = 0

    for (const tu of telegramUsers ?? []) {
      if (!tu.telegram_notifications?.daily_reminder) continue

      const locale = (tu.profiles as any)?.locale ?? "ru"
      const name = (tu.profiles as any)?.name ?? tu.first_name ?? ""

      const messages = {
        kk: `🌙 <b>Кеш жарық, ${name}!</b>\n\nБүгін қандай қаржылық операциялар болды?\n\nМаған кіріс пен шығысыңды айт, мен талдауға сақтайын! 📊`,
        ru: `🌙 <b>Добрый вечер, ${name}!</b>\n\nКакие финансовые операции были сегодня?\n\nРасскажи мне о доходах и расходах, я сохраню для анализа! 📊`,
        en: `🌙 <b>Good evening, ${name}!</b>\n\nWhat financial transactions happened today?\n\nTell me about your income and expenses, I'll save them for analysis! 📊`,
      }

      await sendMessage(
        tu.chat_id,
        messages[locale as keyof typeof messages] ?? messages.ru,
        {
          inline_keyboard: [[
            {
              text: locale === "kk" ? "💬 Чатта жазу" : locale === "ru" ? "💬 Написать в чат" : "💬 Write in chat",
              url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://unem-ai.vercel.app"}`,
            },
          ]],
        }
      )
      sent++
    }

    return NextResponse.json({ success: true, sent })
  }

  if (type === "monthly") {
    // Ай сайынғы есеп
    const { data: telegramUsers } = await supabase
      .from("telegram_users")
      .select("*, profiles(name, locale, id), telegram_notifications(monthly_report)")

    let sent = 0

    for (const tu of telegramUsers ?? []) {
      if (!tu.telegram_notifications?.monthly_report) continue

      const locale = (tu.profiles as any)?.locale ?? "ru"
      const name = (tu.profiles as any)?.name ?? ""
      const userId = (tu.profiles as any)?.id

      // Қаржы деректері
      const { data: finances } = await supabase
        .from("finances")
        .select("*")
        .eq("user_id", userId)

      const incomes = (finances ?? []).filter((f) => f.type === "income")
      const expenses = (finances ?? []).filter((f) => f.type === "expense")
      const goals = (finances ?? []).filter((f) => f.type === "goal")

      const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
      const savings = Math.max(totalIncome - totalExpenses, 0)
      const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0

      const fmt = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
        if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
        return `${n} ₸`
      }

      const topGoal = goals[0]
      const monthsToGoal = topGoal && savings > 0
        ? Math.ceil(topGoal.amount / savings)
        : null

      const now = new Date()
      const monthName = now.toLocaleDateString(
        locale === "kk" ? "kk-KZ" : locale === "ru" ? "ru-RU" : "en-US",
        { month: "long", year: "numeric" }
      )

      const emoji = savings > 0 ? "🟢" : "🔴"

      const messages = {
        kk: `📊 <b>${monthName} — Ай сайынғы есеп</b>\n\n` +
          `👋 Сәлем, <b>${name}</b>!\n\n` +
          `💰 Кіріс: <b>${fmt(totalIncome)}</b>\n` +
          `💸 Шығыс: <b>${fmt(totalExpenses)}</b>\n` +
          `${emoji} Жинақ: <b>${fmt(savings)}</b> (${savingsRate}%)\n` +
          `${topGoal ? `\n🎯 Мақсат: <b>${topGoal.title}</b>\n⏳ Жетуге: <b>≈${monthsToGoal} ай</b>` : ""}\n\n` +
          `${savings > 0 ? "💪 Керемет! Жалғастырыңыз!" : "⚠️ Бүгін шығын болды. Ертең үнемдейік!"}`,
        ru: `📊 <b>Ежемесячный отчёт — ${monthName}</b>\n\n` +
          `👋 Привет, <b>${name}</b>!\n\n` +
          `💰 Доход: <b>${fmt(totalIncome)}</b>\n` +
          `💸 Расходы: <b>${fmt(totalExpenses)}</b>\n` +
          `${emoji} Сбережения: <b>${fmt(savings)}</b> (${savingsRate}%)\n` +
          `${topGoal ? `\n🎯 Цель: <b>${topGoal.title}</b>\n⏳ До цели: <b>≈${monthsToGoal} мес</b>` : ""}\n\n` +
          `${savings > 0 ? "💪 Отлично! Продолжайте!" : "⚠️ Сегодня был убыток. Будем экономить!"}`,
        en: `📊 <b>Monthly Report — ${monthName}</b>\n\n` +
          `👋 Hi, <b>${name}</b>!\n\n` +
          `💰 Income: <b>${fmt(totalIncome)}</b>\n` +
          `💸 Expenses: <b>${fmt(totalExpenses)}</b>\n` +
          `${emoji} Savings: <b>${fmt(savings)}</b> (${savingsRate}%)\n` +
          `${topGoal ? `\n🎯 Goal: <b>${topGoal.title}</b>\n⏳ To reach: <b>≈${monthsToGoal} months</b>` : ""}\n\n` +
          `${savings > 0 ? "💪 Great job! Keep it up!" : "⚠️ Had a loss today. Let's save more!"}`,
      }

      await sendMessage(
        tu.chat_id,
        messages[locale as keyof typeof messages] ?? messages.ru,
        {
          inline_keyboard: [[
            {
              text: locale === "kk" ? "📊 Толық талдау" : locale === "ru" ? "📊 Полный анализ" : "📊 Full analysis",
              url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://unem-ai.vercel.app"}/analytics`,
            },
          ]],
        }
      )
      sent++
    }

    return NextResponse.json({ success: true, sent })
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 })
}
