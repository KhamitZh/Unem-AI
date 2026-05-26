import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

async function getSupabase(useServiceRole = false) {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    useServiceRole
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

async function checkAdmin() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) return null
  return user
}

export async function GET(req: Request) {
  const adminUser = await checkAdmin()
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const supabase = await getSupabase(true)
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action") ?? "users"

  if (action === "users") {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, locale, is_admin, created_at")
      .order("created_at", { ascending: false })

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*")

    const { data: usageLimits } = await supabase
      .from("usage_limits")
      .select("*")

    const users = (profiles ?? []).map((p) => ({
      ...p,
      subscription: subscriptions?.find((s) => s.user_id === p.id),
      usage: usageLimits?.find((u) => u.user_id === p.id),
    }))

    return NextResponse.json({ users })
  }

  if (action === "stats") {
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    const { count: proUsers } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan", "pro")

    const { count: familyUsers } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan", "family")

    const { count: totalMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })

    const { count: totalTransactions } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })

    const { count: totalBooks } = await supabase
      .from("user_books")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      totalUsers,
      proUsers,
      familyUsers,
      freeUsers: (totalUsers ?? 0) - (proUsers ?? 0) - (familyUsers ?? 0),
      totalMessages,
      totalTransactions,
      totalBooks,
    })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

export async function POST(req: Request) {
  const adminUser = await checkAdmin()
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const supabase = await getSupabase(true)
  const { action, userId, plan, days } = await req.json()

  // Plan өзгерту
  if (action === "setPlan") {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + (days ?? 30))

    await supabase
      .from("subscriptions")
      .upsert({
        user_id: userId,
        plan,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: endDate.toISOString(),
      }, { onConflict: "user_id" })

    return NextResponse.json({ success: true })
  }

  // Chat лимитін reset
  if (action === "resetUsage") {
    await supabase
      .from("usage_limits")
      .update({ chat_messages_count: 0 })
      .eq("user_id", userId)

    return NextResponse.json({ success: true })
  }

  // Admin ету
  if (action === "toggleAdmin") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single()

    await supabase
      .from("profiles")
      .update({ is_admin: !profile?.is_admin })
      .eq("id", userId)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
