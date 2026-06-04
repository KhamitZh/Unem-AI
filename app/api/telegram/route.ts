import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unem-ai.vercel.app"

async function sendMessage(chatId: string | number, text: string, keyboard?: any) {
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

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
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
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body.message
    const callbackQuery = body.callback_query

    // Callback — Admin Pro береді
    if (callbackQuery) {
      const data = callbackQuery.data
      const chatId = callbackQuery.message.chat.id

      `💳 <b>Төлем реквизиттері:</b>\n\n` +
      `🟡 <b>Kaspi:</b>\n<code>4400 4300 6500 3359</code>\n\n` +
      `🟢 <b>Halyk:</b>\n<code>4003 0351 7403 2958</code>\n\n` +
      `🟠 <b>Freedom:</b>\n<code>4002 8900 3683 2222</code>\n\n` +
      `👤 Аты: <b>Хамит Х.</b>\n\n` +
      `📝 <b>Аудару тәртібі:</b>\n` +
      `1. Карта нөміріне аударыңыз\n` +
      `2. Скриншотты осында жіберіңіз\n` +
      `3. 5-10 минутта Pro белсендіріледі!\n\n` +
      `💰 <b>Бағалар:</b>\n` +
      `• Pro — 30 күн: 2,990 ₸\n` +
      `• Pro — 90 күн: 7,490 ₸\n` +
      `• Pro — 1 жыл: 24,990 ₸\n` +
      `• Отбасы — 30 күн: 4,990 ₸`

      if (data.startsWith("approve_")) {
        const parts = data.split("_")
        const userId = parts[1]
        const plan = parts[2]
        const days = Number(parts[3])

        const supabase = await getSupabase()

        // Plan жаңарту
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + days)

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: endDate.toISOString(),
        }, { onConflict: "user_id" })

        // Пайдаланушының Telegram chat_id алу
        const { data: telegramUser } = await supabase
          .from("telegram_users")
          .select("chat_id")
          .eq("user_id", userId)
          .single()

        // Adminге хабарлама
        await sendMessage(chatId, `✅ <b>${plan.toUpperCase()}</b> жоспары ${days} күнге берілді!`)

        // Пайдаланушыға хабарлама
        if (telegramUser?.chat_id) {
          await sendMessage(
            telegramUser.chat_id,
            `🎉 <b>Құттықтаймыз!</b>\n\nСіздің <b>${plan === "pro" ? "Pro" : "Отбасы"}</b> жоспарыңыз белсендірілді!\n\n✅ ${days} күн қолжетімді\n\nUnem AI-ға кіріңіз: ${APP_URL}`
          )
        }

        // Callback-ке жауап
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: callbackQuery.id, text: "✅ Берілді!" }),
        })
      }

      if (data.startsWith("reject_")) {
        const userId = data.split("_")[1]

        const supabase = await getSupabase()
        const { data: telegramUser } = await supabase
          .from("telegram_users")
          .select("chat_id")
          .eq("user_id", userId)
          .single()

        await sendMessage(chatId, `❌ Төлем қабылданбады.`)

        if (telegramUser?.chat_id) {
          await sendMessage(
            telegramUser.chat_id,
            `❌ Төлемді растай алмадық.\n\nҚайта байланысыңыз: @unemai_support_bot`
          )
        }

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: callbackQuery.id, text: "❌ Қабылданбады" }),
        })
      }

      return NextResponse.json({ ok: true })
    }

    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    const text = message.text ?? ""
    const userFirstName = message.from?.first_name ?? ""

    // /start команда
    if (text.startsWith("/start")) {
      const parts = text.split(" ")
      const userId = parts[1] // /start USER_ID

      if (userId) {
        // Telegram chat_id сақтау
        const supabase = await getSupabase()
        await supabase.from("telegram_users").upsert({
          user_id: userId,
          chat_id: String(chatId),
          username: message.from?.username,
          first_name: userFirstName,
        }, { onConflict: "user_id" })

        // Пайдаланушы профилін алу
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, user_number")
          .eq("id", userId)
          .single()

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("plan")
          .eq("user_id", userId)
          .single()

        await sendMessage(
          chatId,
          `👋 <b>Сәлем, ${profile?.name ?? userFirstName}!</b>\n\n` +
          `🆔 ID: <code>#${profile?.user_number ?? "—"}</code>\n` +
          `📦 Жоспар: <b>${subscription?.plan === "pro" ? "Pro ✨" : subscription?.plan === "family" ? "Отбасы 👨‍👩‍👧" : "Тегін"}</b>\n\n` +
          `💳 <b>Pro жоспарын алу үшін:</b>\n` +
          `1. Kaspi/Halyk/Freedom картасына аударыңыз\n` +
          `2. Скриншотты осында жіберіңіз\n\n` +
          `📞 Сұрақтар болса жазыңыз!`,
          {
            inline_keyboard: [[
              { text: "💳 Төлем реквизиттері", callback_data: `payment_info_${userId}` },
              { text: "🌐 Сайтқа өту", url: APP_URL },
            ]],
          }
        )
      } else {
        await sendMessage(
          chatId,
          `👋 <b>Сәлем!</b> Unem AI қолдау боты.\n\n` +
          `Сайтқа кіріп, профильден бот арқылы байланысыңыз.\n\n` +
          `🌐 ${APP_URL}`
        )
      }
    }

    // Төлем скриншоты келді
    else if (message.photo || message.document) {
      const supabase = await getSupabase()

      // Chat_id бойынша user_id табу
      const { data: telegramUser } = await supabase
        .from("telegram_users")
        .select("user_id, profiles(name, user_number)")
        .eq("chat_id", String(chatId))
        .single()

      if (telegramUser) {
        const profile = telegramUser.profiles as any

        // Adminге жіберу
        await sendMessage(
          ADMIN_CHAT_ID,
          `💳 <b>Жаңа төлем скриншоты!</b>\n\n` +
          `👤 Пайдаланушы: <b>${profile?.name ?? "—"}</b>\n` +
          `🆔 ID: <code>#${profile?.user_number ?? "—"}</code>\n` +
          `📱 Telegram: @${message.from?.username ?? "—"}\n\n` +
          `Жоспар таңдаңыз:`,
          {
            inline_keyboard: [
              [
                { text: "✅ Pro — 30 күн", callback_data: `approve_${telegramUser.user_id}_pro_30` },
                { text: "✅ Pro — 90 күн", callback_data: `approve_${telegramUser.user_id}_pro_90` },
              ],
              [
                { text: "✅ Pro — 1 жыл", callback_data: `approve_${telegramUser.user_id}_pro_365` },
                { text: "✅ Отбасы — 30 күн", callback_data: `approve_${telegramUser.user_id}_family_30` },
              ],
              [
                { text: "❌ Қабылдамау", callback_data: `reject_${telegramUser.user_id}` },
              ],
            ],
          }
        )

        // Пайдаланушыға жауап
        await sendMessage(
          chatId,
          `✅ <b>Скриншот қабылданды!</b>\n\n` +
          `⏳ Admin тексеріп жатыр, 5-10 минут күтіңіз.\n` +
          `Растағаннан кейін Pro автоматты белсендіріледі!`
        )
      } else {
        await sendMessage(
          chatId,
          `❌ Аккаунт табылмады.\n\nАлдымен сайтта тіркеліп, профильден бот арқылы байланысыңыз.\n\n🌐 ${APP_URL}`
        )
      }
    }

    // /balance команда
    else if (text === "/balance") {
      const supabase = await getSupabase()
      const { data: telegramUser } = await supabase
        .from("telegram_users")
        .select("user_id, profiles(name, locale)")
        .eq("chat_id", String(chatId))
        .single()

      if (telegramUser) {
        const userId = telegramUser.user_id
        const locale = (telegramUser.profiles as any)?.locale ?? "ru"

        const { data: finances } = await supabase
          .from("finances")
          .select("*")
          .eq("user_id", userId)

        const incomes = (finances ?? []).filter((f) => f.type === "income")
        const expenses = (finances ?? []).filter((f) => f.type === "expense")
        const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
        const savings = Math.max(totalIncome - totalExpenses, 0)

        const fmt = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M ₸` : n >= 1_000 ? `${Math.round(n/1000)}k ₸` : `${n} ₸`

        await sendMessage(chatId,
          `💰 <b>Балансыңыз:</b>\n\n` +
          `📈 Кіріс: <b>${fmt(totalIncome)}</b>\n` +
          `📉 Шығыс: <b>${fmt(totalExpenses)}</b>\n` +
          `💚 Жинақ: <b>${fmt(savings)}</b>\n\n` +
          `<a href="https://unem-ai.vercel.app/analytics">📊 Толық талдау</a>`
        )
      }
    }

    // /goals команда
    else if (text === "/goals") {
      const supabase = await getSupabase()
      const { data: telegramUser } = await supabase
        .from("telegram_users")
        .select("user_id, profiles(locale)")
        .eq("chat_id", String(chatId))
        .single()

      if (telegramUser) {
        const { data: finances } = await supabase
          .from("finances")
          .select("*")
          .eq("user_id", telegramUser.user_id)

        const goals = (finances ?? []).filter((f) => f.type === "goal")
        const incomes = (finances ?? []).filter((f) => f.type === "income")
        const expenses = (finances ?? []).filter((f) => f.type === "expense")
        const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
        const savings = Math.max(totalIncome - totalExpenses, 0)

        const fmt = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M ₸` : n >= 1_000 ? `${Math.round(n/1000)}k ₸` : `${n} ₸`

        if (!goals.length) {
          await sendMessage(chatId, `🎯 Мақсат жоқ.\n\n<a href="https://unem-ai.vercel.app/finances/goals">Мақсат қосу →</a>`)
        } else {
          const goalsList = goals.map((g) => {
            const months = savings > 0 ? Math.ceil(g.amount / savings) : null
            const progress = savings > 0 ? Math.min((savings / Math.max(g.amount / 12, 1)) * 100, 100) : 0
            const bar = "▓".repeat(Math.round(progress / 10)) + "░".repeat(10 - Math.round(progress / 10))
            return `🎯 <b>${g.title}</b>\n${bar} ${Math.round(progress)}%\n💰 ${fmt(g.amount)}${months ? ` · ≈${months} ай` : ""}`
          }).join("\n\n")

          await sendMessage(chatId, `🎯 <b>Мақсаттарыңыз:</b>\n\n${goalsList}`)
        }
      }
    }

    // /add_income команда
    else if (text.startsWith("/add_income")) {
      const parts = text.split(" ")
      const amount = Number(parts[1])

      if (!amount) {
        await sendMessage(chatId, `❌ Дұрыс формат: <code>/add_income 50000 Жалақы</code>`)
      } else {
        const title = parts.slice(2).join(" ") || "Кіріс"
        const supabase = await getSupabase()
        const { data: telegramUser } = await supabase
          .from("telegram_users")
          .select("user_id")
          .eq("chat_id", String(chatId))
          .single()

        if (telegramUser) {
          await supabase.from("finances").insert({
            user_id: telegramUser.user_id,
            type: "income",
            title,
            amount,
            currency: "KZT",
            period_days: 30,
          })
          await sendMessage(chatId, `✅ <b>Кіріс қосылды!</b>\n\n📈 ${title}: +${amount.toLocaleString()} ₸`)
        }
      }
    }

    // /add_expense команда
    else if (text.startsWith("/add_expense")) {
      const parts = text.split(" ")
      const amount = Number(parts[1])

      if (!amount) {
        await sendMessage(chatId, `❌ Дұрыс формат: <code>/add_expense 3000 Тамақ</code>`)
      } else {
        const title = parts.slice(2).join(" ") || "Шығыс"
        const supabase = await getSupabase()
        const { data: telegramUser } = await supabase
          .from("telegram_users")
          .select("user_id")
          .eq("chat_id", String(chatId))
          .single()

        if (telegramUser) {
          await supabase.from("finances").insert({
            user_id: telegramUser.user_id,
            type: "expense",
            title,
            amount,
            currency: "KZT",
            period_days: 30,
          })
          await sendMessage(chatId, `✅ <b>Шығыс қосылды!</b>\n\n📉 ${title}: -${amount.toLocaleString()} ₸`)
        }
      }
    }

    // /help команда
    else if (text === "/help") {
      await sendMessage(chatId,
        `📋 <b>Командалар тізімі:</b>\n\n` +
        `💰 /balance — Балансты көру\n` +
        `🎯 /goals — Мақсаттар прогресі\n` +
        `📈 /add_income 50000 Жалақы — Кіріс қосу\n` +
        `📉 /add_expense 3000 Тамақ — Шығыс қосу\n` +
        `💳 /pro — Pro жоспарын алу\n\n` +
        `🌐 Сайт: https://unem-ai.vercel.app`
      )
    }

    // /pro команда
    else if (text === "/pro") {
      const supabase = await getSupabase()
      const { data: telegramUser } = await supabase
        .from("telegram_users")
        .select("user_id")
        .eq("chat_id", String(chatId))
        .single()

      await sendMessage(chatId,
        `⭐ <b>Pro жоспарын алу</b>\n\n` +
        `💰 Бағалар:\n` +
        `• 30 күн — 2,990 ₸\n` +
        `• 90 күн — 7,490 ₸\n` +
        `• 1 жыл — 24,990 ₸\n\n` +
        `💳 Реквизиттерді алу үшін батырманы басыңыз:`,
        {
          inline_keyboard: [[
            { text: "💳 Реквизиттер", callback_data: `payment_info_${telegramUser?.user_id}` },
          ]],
        }
      )
    }

    // Басқа хабарламалар
    else if (text && !text.startsWith("/")) {
      await sendMessage(
        chatId,
        `💬 Хабарламаңыз алынды!\n\n` +
        `Төлем жасау үшін скриншот жіберіңіз.\n` +
        `Сұрақтар болса күтіңіз, admin жауап береді.`
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Telegram webhook error:", e)
    return NextResponse.json({ ok: true })
  }
}
