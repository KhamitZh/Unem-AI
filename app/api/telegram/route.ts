import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unem-ai.vercel.app"

async function sendMessage(chatId: string | number, text: string, keyboard?: any, photoUrl?: string) {
  if (photoUrl) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: text,
        parse_mode: "HTML",
        reply_markup: keyboard,
      }),
    })
    return
  }

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: keyboard,
      disable_web_page_preview: true,
    }),
  })
}

async function answerCallback(callbackId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text: text ?? "" }),
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

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

const PRICES = {
  pro_30: { label: "Pro — 30 күн", price: "2,990 ₸", days: 30, plan: "pro" },
  pro_90: { label: "Pro — 90 күн", price: "7,490 ₸", days: 90, plan: "pro" },
  pro_365: { label: "Pro — 1 жыл", price: "24,990 ₸", days: 365, plan: "pro" },
  family_30: { label: "Отбасы — 30 күн", price: "4,990 ₸", days: 30, plan: "family" },
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body.message
    const callbackQuery = body.callback_query

    // ============ CALLBACK HANDLER ============
    if (callbackQuery) {
      const data = callbackQuery.data
      const chatId = callbackQuery.message.chat.id
      const supabase = await getSupabase()

      // 💳 Реквизиттер
      if (data.startsWith("payment_info_")) {
        const userId = data.replace("payment_info_", "")
        await answerCallback(callbackQuery.id)
        await sendMessage(
          chatId,
          `💳 <b>Төлем реквизиттері</b>\n\n` +
          `Төменде көрсетілген карта нөмірлерінің біріне аударыңыз:\n\n` +
          `🟡 <b>Kaspi Bank</b>\n` +
          `<code>4400 4300 6500 3359</code>\n\n` +
          `🟢 <b>Halyk Bank</b>\n` +
          `<code>4003 0351 7403 2958</code>\n\n` +
          `🟠 <b>Freedom Bank</b>\n` +
          `<code>4002 8900 3683 2222</code>\n\n` +
          `👤 Алушы: <b>Zhanuzakov KH</b>\n\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `💰 <b>Тарифтер:</b>\n` +
          `• Pro 30 күн → <b>2,990 ₸</b>\n` +
          `• Pro 90 күн → <b>7,490 ₸</b>\n` +
          `• Pro 1 жыл → <b>24,990 ₸</b>\n` +
          `• Отбасы 30 күн → <b>4,990 ₸</b>\n` +
          `━━━━━━━━━━━━━━━━\n\n` +
          `📸 Аударым жасап, <b>скриншотты осы чатқа жіберіңіз</b>\n` +
          `⏱ 5-10 минутта Pro белсендіріледі!`,
          {
            inline_keyboard: [[
              { text: "✅ Скриншот жіберу дайын", callback_data: `ready_${userId}` },
            ]],
          }
        )
      }

      // ✅ Дайын батырмасы
      else if (data.startsWith("ready_")) {
        await answerCallback(callbackQuery.id)
        await sendMessage(
          chatId,
          `📸 <b>Скриншотты осы чатқа жіберіңіз!</b>\n\n` +
          `Admin 5-10 минут ішінде тексереді.`
        )
      }

      // ✅ Admin — Pro береді
      else if (data.startsWith("approve_")) {
        const parts = data.split("_")
        const userId = parts[1]
        const plan = parts[2]
        const days = Number(parts[3])

        const endDate = new Date()
        endDate.setDate(endDate.getDate() + days)

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: endDate.toISOString(),
        }, { onConflict: "user_id" })

        // Пайдаланушыға жіберу
        const { data: telegramUser } = await supabase
          .from("telegram_users")
          .select("chat_id")
          .eq("user_id", userId)
          .single()

        await answerCallback(callbackQuery.id, "✅ Берілді!")
        await sendMessage(chatId,
          `✅ <b>${plan === "pro" ? "Pro" : "Отбасы"}</b> жоспары <b>${days} күнге</b> берілді!\n\n` +
          `📅 Аяқталу: ${endDate.toLocaleDateString("ru-RU")}`
        )

        if (telegramUser?.chat_id) {
          await sendMessage(
            telegramUser.chat_id,
            `🎉 <b>Құттықтаймыз!</b>\n\n` +
            `✨ <b>${plan === "pro" ? "Pro" : "Отбасы"}</b> жоспарыңыз белсендірілді!\n\n` +
            `📅 Мерзімі: <b>${days} күн</b>\n` +
            `⏰ Аяқталу: ${endDate.toLocaleDateString("ru-RU")}\n\n` +
            `Unem AI-ға кіріп барлық мүмкіндіктерді пайдаланыңыз! 🚀`,
            {
              inline_keyboard: [[
                { text: "🚀 Unem AI ашу", url: APP_URL },
              ]],
            }
          )
        }

        // Жетістік беру
        await fetch(`${APP_URL}/api/achievements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "pro_user", targetUserId: userId }),
        }).catch(() => {})
      }

      // ❌ Admin — Қабылдамайды
      else if (data.startsWith("reject_")) {
        const userId = data.split("_")[1]
        const { data: telegramUser } = await supabase
          .from("telegram_users")
          .select("chat_id")
          .eq("user_id", userId)
          .single()

        await answerCallback(callbackQuery.id, "❌ Қабылданбады")
        await sendMessage(chatId, `❌ Төлем қабылданбады.`)

        if (telegramUser?.chat_id) {
          await sendMessage(
            telegramUser.chat_id,
            `❌ <b>Төлемді растай алмадық</b>\n\n` +
            `Мүмкін себептер:\n` +
            `• Сома дұрыс емес\n` +
            `• Скриншот анық емес\n\n` +
            `Қайта жіберіңіз немесе @unemai_support_bot-қа хабарласыңыз.`,
            {
              inline_keyboard: [[
                { text: "💳 Реквизиттер", callback_data: `payment_info_${userId}` },
              ]],
            }
          )
        }
      }

      return NextResponse.json({ ok: true })
    }

    // ============ MESSAGE HANDLER ============
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    const text = message.text ?? ""
    const userFirstName = message.from?.first_name ?? ""

    // /start
    if (text.startsWith("/start")) {
      const userId = text.split(" ")[1]
      const supabase = await getSupabase()

      if (userId) {
        await supabase.from("telegram_users").upsert({
          user_id: userId,
          chat_id: String(chatId),
          username: message.from?.username,
          first_name: userFirstName,
        }, { onConflict: "user_id" })

        const { data: profile } = await supabase
          .from("profiles")
          .select("name, user_number")
          .eq("id", userId)
          .single()

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("plan, current_period_end")
          .eq("user_id", userId)
          .single()

        const { data: finances } = await supabase
          .from("finances")
          .select("type, amount")
          .eq("user_id", userId)

        const totalIncome = (finances ?? []).filter(f => f.type === "income").reduce((s, i) => s + i.amount, 0)
        const totalExpenses = (finances ?? []).filter(f => f.type === "expense").reduce((s, i) => s + i.amount, 0)
        const savings = Math.max(totalIncome - totalExpenses, 0)

        const planEmoji = subscription?.plan === "pro" ? "✨ Pro" : subscription?.plan === "family" ? "👨‍👩‍👧 Отбасы" : "🆓 Тегін"

        await sendMessage(
          chatId,
          `👋 <b>Сәлем, ${profile?.name ?? userFirstName}!</b>\n\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `🆔 ID: <code>#${profile?.user_number ?? "—"}</code>\n` +
          `📦 Жоспар: <b>${planEmoji}</b>\n` +
          `━━━━━━━━━━━━━━━━\n\n` +
          `💰 <b>Қаржылық жағдай:</b>\n` +
          `📈 Кіріс: <b>${fmt(totalIncome)}</b>\n` +
          `📉 Шығыс: <b>${fmt(totalExpenses)}</b>\n` +
          `💚 Жинақ: <b>${fmt(savings)}</b>\n\n` +
          `Не жасағыңыз келеді?`,
          {
            inline_keyboard: [
              [
                { text: "💳 Pro алу", callback_data: `payment_info_${userId}` },
                { text: "📊 Аналитика", url: `${APP_URL}/analytics` },
              ],
              [
                { text: "🎯 Мақсаттар", url: `${APP_URL}/finances/goals` },
                { text: "🌐 Сайтқа өту", url: APP_URL },
              ],
            ],
          }
        )
      } else {
        await sendMessage(
          chatId,
          `👋 <b>Unem AI-ға қош келдіңіз!</b>\n\n` +
          `🤖 Қазақстандықтарға арналған ақылды қаржы кеңесшісі\n\n` +
          `Толық мүмкіндіктерді пайдалану үшін сайтта тіркеліңіз:`,
          {
            inline_keyboard: [[
              { text: "🚀 Тіркелу", url: `${APP_URL}/auth` },
            ]],
          }
        )
      }
    }

    // 📸 Скриншот — төлем
    else if (message.photo || message.document) {
      const supabase = await getSupabase()
      const { data: telegramUser } = await supabase
        .from("telegram_users")
        .select("user_id, profiles(name, user_number)")
        .eq("chat_id", String(chatId))
        .single()

      if (telegramUser) {
        const profile = telegramUser.profiles as any

        await sendMessage(
          ADMIN_CHAT_ID,
          `💳 <b>Жаңа төлем скриншоты!</b>\n\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `👤 <b>${profile?.name ?? "—"}</b>\n` +
          `🆔 ID: <code>#${profile?.user_number ?? "—"}</code>\n` +
          `📱 @${message.from?.username ?? "жоқ"}\n` +
          `━━━━━━━━━━━━━━━━\n\n` +
          `Қай жоспар беру керек?`,
          {
            inline_keyboard: [
              [
                { text: "✅ Pro 30 күн — 2,990₸", callback_data: `approve_${telegramUser.user_id}_pro_30` },
                { text: "✅ Pro 90 күн — 7,490₸", callback_data: `approve_${telegramUser.user_id}_pro_90` },
              ],
              [
                { text: "✅ Pro 1 жыл — 24,990₸", callback_data: `approve_${telegramUser.user_id}_pro_365` },
                { text: "✅ Отбасы 30 күн — 4,990₸", callback_data: `approve_${telegramUser.user_id}_family_30` },
              ],
              [
                { text: "❌ Қабылдамау", callback_data: `reject_${telegramUser.user_id}` },
              ],
            ],
          }
        )

        await sendMessage(
          chatId,
          `✅ <b>Скриншот қабылданды!</b>\n\n` +
          `⏳ Admin тексеруде...\n` +
          `🕐 Күту уақыты: 5-10 минут\n\n` +
          `Растағаннан кейін автоматты хабарлама келеді! 🎉`
        )
      } else {
        await sendMessage(
          chatId,
          `❌ <b>Аккаунт табылмады!</b>\n\n` +
          `Алдымен сайтта тіркеліп, профильден ботқа қосылыңыз.`,
          {
            inline_keyboard: [[
              { text: "🚀 Тіркелу", url: `${APP_URL}/auth` },
            ]],
          }
        )
      }
    }

    // /balance
    else if (text === "/balance") {
      const supabase = await getSupabase()
      const { data: telegramUser } = await supabase
        .from("telegram_users")
        .select("user_id, profiles(name, locale)")
        .eq("chat_id", String(chatId))
        .single()

      if (telegramUser) {
        const { data: finances } = await supabase
          .from("finances")
          .select("*")
          .eq("user_id", telegramUser.user_id)

        const incomes = (finances ?? []).filter(f => f.type === "income")
        const expenses = (finances ?? []).filter(f => f.type === "expense")
        const goals = (finances ?? []).filter(f => f.type === "goal")
        const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
        const savings = Math.max(totalIncome - totalExpenses, 0)
        const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0

        const topGoal = goals[0]
        const monthsToGoal = topGoal && savings > 0 ? Math.ceil(topGoal.amount / savings) : null

        await sendMessage(
          chatId,
          `💰 <b>Қаржылық жағдай</b>\n\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `📈 Кіріс: <b>${fmt(totalIncome)}</b>\n` +
          `📉 Шығыс: <b>${fmt(totalExpenses)}</b>\n` +
          `💚 Жинақ: <b>${fmt(savings)}</b> (${savingsRate}%)\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `${topGoal ? `\n🎯 Мақсат: <b>${topGoal.title}</b>\n💵 Сома: ${fmt(topGoal.amount)}\n⏳ Жетуге: ≈${monthsToGoal} ай\n` : ""}`,
          {
            inline_keyboard: [[
              { text: "📊 Толық талдау", url: `${APP_URL}/analytics` },
              { text: "➕ Кіріс қосу", url: `${APP_URL}/finances/income` },
            ]],
          }
        )
      }
    }

    // /goals
    else if (text === "/goals") {
      const supabase = await getSupabase()
      const { data: telegramUser } = await supabase
        .from("telegram_users")
        .select("user_id")
        .eq("chat_id", String(chatId))
        .single()

      if (telegramUser) {
        const { data: finances } = await supabase
          .from("finances").select("*").eq("user_id", telegramUser.user_id)

        const goals = (finances ?? []).filter(f => f.type === "goal")
        const totalIncome = (finances ?? []).filter(f => f.type === "income").reduce((s, i) => s + i.amount, 0)
        const totalExpenses = (finances ?? []).filter(f => f.type === "expense").reduce((s, e) => s + e.amount, 0)
        const savings = Math.max(totalIncome - totalExpenses, 0)

        if (!goals.length) {
          await sendMessage(
            chatId,
            `🎯 <b>Мақсат жоқ</b>\n\nМақсат қосу үшін сайтқа кіріңіз:`,
            { inline_keyboard: [[{ text: "➕ Мақсат қосу", url: `${APP_URL}/finances/goals` }]] }
          )
        } else {
          const list = goals.map((g, i) => {
            const months = savings > 0 ? Math.ceil(g.amount / savings) : null
            const pct = savings > 0 ? Math.min((savings / Math.max(g.amount / 12, 1)) * 100, 100) : 0
            const bar = "▓".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10))
            return `${i + 1}. 🎯 <b>${g.title}</b>\n${bar} ${Math.round(pct)}%\n💵 ${fmt(g.amount)}${months ? ` · ≈${months} ай` : ""}`
          }).join("\n\n")

          await sendMessage(chatId,
            `🎯 <b>Мақсаттарыңыз</b>\n\n${list}`,
            { inline_keyboard: [[{ text: "📊 Толық көру", url: `${APP_URL}/goal-tracker` }]] }
          )
        }
      }
    }

    // /add_income
    else if (text.startsWith("/add_income")) {
      const parts = text.split(" ")
      const amount = Number(parts[1])
      if (!amount) {
        await sendMessage(chatId, `❌ Формат: <code>/add_income 50000 Жалақы</code>`)
      } else {
        const title = parts.slice(2).join(" ") || "Кіріс"
        const supabase = await getSupabase()
        const { data: tu } = await supabase.from("telegram_users").select("user_id").eq("chat_id", String(chatId)).single()
        if (tu) {
          await supabase.from("finances").insert({ user_id: tu.user_id, type: "income", title, amount, currency: "KZT", period_days: 30 })
          await sendMessage(chatId, `✅ <b>Кіріс қосылды!</b>\n\n📈 ${title}\n💰 +${amount.toLocaleString()} ₸`)
        }
      }
    }

    // /add_expense
    else if (text.startsWith("/add_expense")) {
      const parts = text.split(" ")
      const amount = Number(parts[1])
      if (!amount) {
        await sendMessage(chatId, `❌ Формат: <code>/add_expense 3000 Тамақ</code>`)
      } else {
        const title = parts.slice(2).join(" ") || "Шығыс"
        const supabase = await getSupabase()
        const { data: tu } = await supabase.from("telegram_users").select("user_id").eq("chat_id", String(chatId)).single()
        if (tu) {
          await supabase.from("finances").insert({ user_id: tu.user_id, type: "expense", title, amount, currency: "KZT", period_days: 30 })
          await sendMessage(chatId, `✅ <b>Шығыс қосылды!</b>\n\n📉 ${title}\n💸 -${amount.toLocaleString()} ₸`)
        }
      }
    }

    // /pro
    else if (text === "/pro") {
      const supabase = await getSupabase()
      const { data: tu } = await supabase.from("telegram_users").select("user_id").eq("chat_id", String(chatId)).single()
      await sendMessage(
        chatId,
        `⭐ <b>Unem AI Pro</b>\n\n` +
        `<b>Pro мүмкіндіктері:</b>\n` +
        `✅ Шексіз AI чат\n` +
        `✅ Қаржылық талдау\n` +
        `✅ AI инвестиция кеңесші\n` +
        `✅ KASE нарықы мониторинг\n` +
        `✅ Крипто портфель\n` +
        `✅ PDF парсинг\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `💰 <b>Бағалар:</b>\n` +
        `• 30 күн → <b>2,990 ₸</b>\n` +
        `• 90 күн → <b>7,490 ₸</b>\n` +
        `• 1 жыл → <b>24,990 ₸</b>\n` +
        `━━━━━━━━━━━━━━━━`,
        {
          inline_keyboard: [
            [{ text: "💳 Төлем реквизиттері", callback_data: `payment_info_${tu?.user_id}` }],
            [{ text: "🌐 Сайтта алу", url: `${APP_URL}` }],
          ],
        }
      )
    }

    // /help
    else if (text === "/help") {
      await sendMessage(
        chatId,
        `📋 <b>Unem AI Bot — Командалар</b>\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `💰 /balance — Баланс көру\n` +
        `🎯 /goals — Мақсаттар\n` +
        `📈 /add_income 50000 Жалақы\n` +
        `📉 /add_expense 3000 Тамақ\n` +
        `⭐ /pro — Pro алу\n` +
        `📋 /help — Командалар\n` +
        `━━━━━━━━━━━━━━━━\n\n` +
        `💳 Төлем → скриншот жіберіңіз\n` +
        `🌐 Сайт: ${APP_URL}`,
        {
          inline_keyboard: [[
            { text: "🚀 Сайтқа өту", url: APP_URL },
          ]],
        }
      )
    }

    // Басқа хабарламалар
    else if (text && !text.startsWith("/")) {
      await sendMessage(
        chatId,
        `💬 Хабарламаңыз алынды!\n\n` +
        `Төлем жасасаңыз — скриншотты жіберіңіз.\n` +
        `Сұрақтарыңыз болса — /help жазыңыз.`,
        {
          inline_keyboard: [[
            { text: "📋 Командалар", callback_data: "help" },
            { text: "💳 Pro алу", callback_data: `payment_info_` },
          ]],
        }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Telegram webhook error:", e)
    return NextResponse.json({ ok: true })
  }
}
