import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

async function getSupabase(useAdmin = false) {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    useAdmin
      ? process.env.SUPABASE_SERVICE_ROLE_KEY!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

const ACHIEVEMENTS_DEF = [
  { type: "first_chat", icon: "💬", xp: 50, level: 1, title: "Алғашқы қадам", title_ru: "Первый шаг", title_en: "First step", description: "Алғашқы чат жазды", description_ru: "Написал первый чат", description_en: "Sent first message" },
  { type: "first_income", icon: "💰", xp: 100, level: 1, title: "Кіріс қосты", title_ru: "Добавил доход", title_en: "Added income", description: "Алғашқы кірісін қосты", description_ru: "Добавил первый доход", description_en: "Added first income" },
  { type: "first_goal", icon: "🎯", xp: 100, level: 1, title: "Мақсат қойды", title_ru: "Поставил цель", title_en: "Set a goal", description: "Алғашқы мақсатын қойды", description_ru: "Поставил первую цель", description_en: "Set first goal" },
  { type: "first_expense", icon: "📉", xp: 50, level: 1, title: "Шығыс қосты", title_ru: "Добавил расход", title_en: "Added expense", description: "Алғашқы шығысын қосты", description_ru: "Добавил первый расход", description_en: "Added first expense" },
  { type: "saver_1", icon: "🏦", xp: 200, level: 2, title: "Үнемші", title_ru: "Экономный", title_en: "Saver", description: "10%-дан астам үнемдеді", description_ru: "Сэкономил более 10%", description_en: "Saved more than 10%" },
  { type: "saver_2", icon: "💎", xp: 500, level: 3, title: "Қаржы шебері", title_ru: "Финансовый мастер", title_en: "Finance master", description: "30%-дан астам үнемдеді", description_ru: "Сэкономил более 30%", description_en: "Saved more than 30%" },
  { type: "streak_7", icon: "🔥", xp: 150, level: 2, title: "7 күн белсенді", title_ru: "7 дней активности", title_en: "7 day streak", description: "7 күн қатарынан кірді", description_ru: "7 дней подряд заходил", description_en: "Active 7 days in a row" },
  { type: "referral_1", icon: "👥", xp: 300, level: 2, title: "Дос шақырды", title_ru: "Пригласил друга", title_en: "Invited friend", description: "Алғашқы досын шақырды", description_ru: "Пригласил первого друга", description_en: "Invited first friend" },
  { type: "books_5", icon: "📚", xp: 200, level: 2, title: "Оқырман", title_ru: "Читатель", title_en: "Reader", description: "5 кітап оқыды", description_ru: "Прочитал 5 книг", description_en: "Read 5 books" },
  { type: "pro_user", icon: "⭐", xp: 500, level: 3, title: "Pro мүше", title_ru: "Pro участник", title_en: "Pro member", description: "Pro жоспарын алды", description_ru: "Получил Pro план", description_en: "Got Pro plan" },
  { type: "community_1", icon: "🌐", xp: 100, level: 1, title: "Қоғам мүшесі", title_ru: "Член сообщества", title_en: "Community member", description: "Алғашқы постын жазды", description_ru: "Написал первый пост", description_en: "Wrote first post" },
  { type: "goal_reached", icon: "🏆", xp: 1000, level: 4, title: "Мақсатқа жетті!", title_ru: "Цель достигнута!", title_en: "Goal reached!", description: "Мақсатына жетті", description_ru: "Достиг своей цели", description_en: "Reached the goal" },
  { type: "level_5", icon: "🚀", xp: 500, level: 5, title: "5-деңгей", title_ru: "5 уровень", title_en: "Level 5", description: "5-деңгейге жетті", description_ru: "Достиг 5 уровня", description_en: "Reached level 5" },
  { type: "level_10", icon: "👑", xp: 1000, level: 10, title: "10-деңгей", title_ru: "10 уровень", title_en: "Level 10", description: "10-деңгейге жетті", description_ru: "Достиг 10 уровня", description_en: "Reached level 10" },
]

export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false })

  // XP және деңгей
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, level")
    .eq("id", user.id)
    .single()

  const totalXP = profile?.total_xp ?? 0
  const level = Math.floor(totalXP / 500) + 1
  const nextLevelXP = level * 500
  const progress = Math.round(((totalXP % 500) / 500) * 100)

  return NextResponse.json({
    achievements: achievements ?? [],
    allAchievements: ACHIEVEMENTS_DEF,
    totalXP,
    level,
    nextLevelXP,
    progress,
  })
}

export async function POST(req: Request) {
  const supabase = await getSupabase()
  const supabaseAdmin = await getSupabase(true)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { type, targetUserId } = await req.json()
  const userId = targetUserId ?? user.id

  const def = ACHIEVEMENTS_DEF.find((a) => a.type === type)
  if (!def) return NextResponse.json({ error: "Unknown achievement" }, { status: 400 })

  // Бұрын бар ма?
  const { data: existing } = await supabaseAdmin
    .from("achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .single()

  if (existing) return NextResponse.json({ exists: true })

  // Жетістік беру
  const { data: achievement } = await supabaseAdmin
    .from("achievements")
    .insert({
      user_id: userId,
      type,
      title: def.title,
      title_ru: def.title_ru,
      title_en: def.title_en,
      description: def.description,
      description_ru: def.description_ru,
      description_en: def.description_en,
      icon: def.icon,
      level: def.level,
      xp: def.xp,
    })
    .select()
    .single()

  // XP қосу
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("total_xp")
    .eq("id", userId)
    .single()

  const newXP = (profile?.total_xp ?? 0) + def.xp
  const newLevel = Math.floor(newXP / 500) + 1

  await supabaseAdmin
    .from("profiles")
    .update({ total_xp: newXP, level: newLevel })
    .eq("id", userId)

  return NextResponse.json({ achievement, xp: def.xp, newLevel })
}
