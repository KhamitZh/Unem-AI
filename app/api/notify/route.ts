import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const { type, goalTitle, months } = await req.json()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Пайдаланушы профилін алу
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, locale")
    .eq("id", user.id)
    .single()

  const locale = profile?.locale ?? "ru"
  const name = profile?.name ?? ""

  // Email мазмұны
  const subjects: Record<string, string> = {
    kk: `🎯 Unem AI — "${goalTitle}" мақсатыңыз жақын!`,
    ru: `🎯 Unem AI — Цель "${goalTitle}" близко!`,
    en: `🎯 Unem AI — Goal "${goalTitle}" is close!`,
  }

  const bodies: Record<string, string> = {
    kk: `
Сәлем, ${name}!

Керемет жаңалық! "${goalTitle}" мақсатыңызға небары ${months} ай қалды! 🎉

Осы қарқынды сақтаңыз:
- Шығыстарыңызды қадағалаңыз
- Қосымша кіріс табу жолдарын іздеңіз
- Жинақтарыңызды депозитке салыңыз

Сізге сенемін! 💪

Unem AI командасы
    `,
    ru: `
Привет, ${name}!

Отличная новость! До цели "${goalTitle}" осталось всего ${months} месяца! 🎉

Продолжайте в том же темпе:
- Следите за расходами
- Ищите дополнительные источники дохода
- Положите сбережения на депозит

Мы верим в вас! 💪

Команда Unem AI
    `,
    en: `
Hi ${name}!

Great news! You're only ${months} months away from your goal "${goalTitle}"! 🎉

Keep up the momentum:
- Track your expenses
- Look for additional income sources
- Put your savings in a deposit

We believe in you! 💪

Unem AI Team
    `,
  }

  // Supabase арқылы email жіберу
  const { error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: user.email!,
  })

  // Supabase Edge Function немесе SMTP арқылы email жіберу
  const emailRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: user.email,
      subject: subjects[locale] ?? subjects.ru,
      body: bodies[locale] ?? bodies.ru,
    }),
  })

  return NextResponse.json({ success: true })
}
