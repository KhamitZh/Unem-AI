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

export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Профильді алу
  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code, referred_by")
    .eq("id", user.id)
    .single()

  // Шақырылған достар
  const { data: referrals } = await supabase
    .from("referrals")
    .select("*, profiles!referrals_referred_id_fkey(name)")
    .eq("referrer_id", user.id)

  const totalRewardDays = (referrals ?? [])
    .filter((r) => r.status === "completed")
    .reduce((s, r) => s + r.reward_days, 0)

  return NextResponse.json({
    referralCode: profile?.referral_code,
    referralLink: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://unem-ai.vercel.app"}/auth?ref=${profile?.referral_code}`,
    referrals: referrals ?? [],
    totalRewardDays,
    referredBy: profile?.referred_by,
  })
}

export async function POST(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action, code } = await req.json()

  if (action === "applyReferral") {
    // Реферал кодын тексеру
    const { data: referrer } = await supabase
      .from("profiles")
      .select("id, referral_code")
      .eq("referral_code", code.toUpperCase())
      .single()

    if (!referrer) {
      return NextResponse.json({ error: "Код табылмады" }, { status: 400 })
    }

    if (referrer.id === user.id) {
      return NextResponse.json({ error: "Өз кодыңызды пайдалана алмайсыз" }, { status: 400 })
    }

    // Бұрын қолданды ма?
    const { data: existing } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("id", user.id)
      .single()

    if (existing?.referred_by) {
      return NextResponse.json({ error: "Реферал коды бұрын қолданылды" }, { status: 400 })
    }

    // Referred_by жазу
    await supabase
      .from("profiles")
      .update({ referred_by: referrer.id })
      .eq("id", user.id)

    // Referral жазба жасау
    await supabase.from("referrals").insert({
      referrer_id: referrer.id,
      referred_id: user.id,
      code: code.toUpperCase(),
      status: "completed",
      reward_days: 7,
    })

    // Екеуіне де 7 күн Pro беру
    const supabaseAdmin = await getSupabase(true)

    for (const uid of [referrer.id, user.id]) {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("trial_ends_at, current_period_end, plan")
        .eq("user_id", uid)
        .single()

      const now = new Date()
      const currentEnd = sub?.current_period_end
        ? new Date(sub.current_period_end)
        : now
      const newEnd = new Date(Math.max(currentEnd.getTime(), now.getTime()))
      newEnd.setDate(newEnd.getDate() + 7)

      await supabaseAdmin.from("subscriptions").upsert({
        user_id: uid,
        plan: sub?.plan === "family" ? "family" : "pro",
        status: "active",
        current_period_end: newEnd.toISOString(),
      }, { onConflict: "user_id" })
    }

    return NextResponse.json({ success: true, rewardDays: 7 })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
