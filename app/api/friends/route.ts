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

export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Достар тізімі
  const { data: friends } = await supabase
    .from("friends")
    .select("*, profiles!friends_friend_id_fkey(name, user_number, avatar_url)")
    .eq("user_id", user.id)
    .eq("status", "accepted")

  // Кіріс сұраныстар
  const { data: requests } = await supabase
    .from("friends")
    .select("*, profiles!friends_user_id_fkey(name, user_number, avatar_url)")
    .eq("friend_id", user.id)
    .eq("status", "pending")

  return NextResponse.json({
    friends: friends ?? [],
    requests: requests ?? [],
  })
}

export async function POST(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action, friendId, userNumber } = await req.json()

  // ID бойынша дос қосу
  if (action === "add") {
    // User number бойынша іздеу
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("id, name, user_number")
      .eq("user_number", userNumber)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: "Пайдаланушы табылмады" }, { status: 404 })
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: "Өзіңізді дос қоса алмайсыз" }, { status: 400 })
    }

    // Бұрын бар ма?
    const { data: existing } = await supabase
      .from("friends")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("friend_id", targetUser.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Сұраныс бұрын жіберілген" }, { status: 400 })
    }

    await supabase.from("friends").insert({
      user_id: user.id,
      friend_id: targetUser.id,
      status: "pending",
    })

    return NextResponse.json({ success: true, name: targetUser.name })
  }

  // Сұранысты қабылдау
  if (action === "accept") {
    await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("user_id", friendId)
      .eq("friend_id", user.id)

    // Кері байланыс
    await supabase.from("friends").upsert({
      user_id: user.id,
      friend_id: friendId,
      status: "accepted",
    }, { onConflict: "user_id,friend_id" })

    return NextResponse.json({ success: true })
  }

  // Сұранысты қабылдамау / досты өшіру
  if (action === "remove") {
    await supabase.from("friends").delete()
      .eq("user_id", user.id).eq("friend_id", friendId)
    await supabase.from("friends").delete()
      .eq("user_id", friendId).eq("friend_id", user.id)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
