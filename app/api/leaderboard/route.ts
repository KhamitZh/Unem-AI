import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
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
}

export async function GET(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const period = searchParams.get("period") ?? "month"

  // Барлық пайдаланушылардың finances деректерін алу
  const { data: allFinances } = await supabase
    .from("finances")
    .select("user_id, type, amount")

  if (!allFinances) return NextResponse.json({ leaders: [], myRank: null })

  // Пайдаланушы бойынша жинақ есептеу
  const userSavingsMap: Record<string, number> = {}

  allFinances.forEach((f) => {
    if (!userSavingsMap[f.user_id]) userSavingsMap[f.user_id] = 0
    if (f.type === "income") userSavingsMap[f.user_id] += f.amount
    if (f.type === "expense") userSavingsMap[f.user_id] -= f.amount
  })

  // Тек оң жинақты алу
  const userIds = Object.entries(userSavingsMap)
    .filter(([, savings]) => savings > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .map(([id]) => id)

  if (!userIds.length) return NextResponse.json({ leaders: [], myRank: null })

  // Профильдерді алу
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", userIds)

  const leaders = userIds.map((uid, i) => {
    const profile = profiles?.find((p) => p.id === uid)
    return {
      id: uid,
      name: profile?.name ?? null,
      savings: Math.max(userSavingsMap[uid] ?? 0, 0),
      rank: i + 1,
      isMe: uid === user.id,
    }
  })

  // Менің орным
  const myIndex = leaders.findIndex((l) => l.id === user.id)
  const myRank = myIndex >= 0 ? leaders[myIndex] : {
    id: user.id,
    savings: Math.max(userSavingsMap[user.id] ?? 0, 0),
    rank: leaders.length + 1,
    isMe: true,
  }

  return NextResponse.json({
    leaders: leaders.slice(0, 20),
    myRank,
  })
}
