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
