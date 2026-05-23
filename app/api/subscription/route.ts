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

export const PLANS = {
  free: {
    name: "Тегін",
    chatMessages: 20,
    finances: 3,
    goals: 1,
    books: 10,
    family: false,
    csv: false,
    analytics: false,
    monthlyReport: false,
  },
  pro: {
    name: "Pro",
    chatMessages: Infinity,
    finances: Infinity,
    goals: Infinity,
    books: Infinity,
    family: false,
    csv: true,
    analytics: true,
    monthlyReport: true,
  },
  family: {
    name: "Отбасы",
    chatMessages: Infinity,
    finances: Infinity,
    goals: Infinity,
    books: Infinity,
    family: true,
    csv: true,
    analytics: true,
    monthlyReport: true,
  },
}

export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Subscription алу
  let { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Жоқ болса жасау
  if (!subscription) {
    const { data: newSub } = await supabase
      .from("subscriptions")
      .insert({ user_id: user.id, plan: "free", status: "active" })
      .select()
      .single()
    subscription = newSub
  }

  // Usage limits алу
  let { data: usage } = await supabase
    .from("usage_limits")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!usage) {
    const { data: newUsage } = await supabase
      .from("usage_limits")
      .insert({ user_id: user.id })
      .select()
      .single()
    usage = newUsage
  }

  // Trial тексеру
  const isTrial = subscription?.trial_ends_at && new Date(subscription.trial_ends_at) > new Date()
  const effectivePlan = isTrial ? "pro" : (subscription?.plan ?? "free")
  const planLimits = PLANS[effectivePlan as keyof typeof PLANS] ?? PLANS.free

  // Ай сайын reset
  const lastReset = new Date(usage?.last_reset_at ?? 0)
  const now = new Date()
  if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
    await supabase
      .from("usage_limits")
      .update({ chat_messages_count: 0, last_reset_at: now.toISOString() })
      .eq("user_id", user.id)
    if (usage) usage.chat_messages_count = 0
  }

  return NextResponse.json({
    subscription,
    usage,
    plan: effectivePlan,
    limits: planLimits,
    isTrial,
    trialDaysLeft: isTrial
      ? Math.ceil((new Date(subscription.trial_ends_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0,
  })
}

export async function POST(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action, plan, promoCode } = await req.json()

  // Чат хабарлама санауыш
  if (action === "incrementChat") {
    await supabase.rpc("increment_chat_count", { uid: user.id })
    return NextResponse.json({ success: true })
  }

  // Promo код
  if (action === "applyPromo") {
    const PROMO_CODES: Record<string, { plan: string; days: number }> = {
      "UNEMAI2025": { plan: "pro", days: 30 },
      "QAZAQSTAN": { plan: "pro", days: 7 },
      "FAMILY2025": { plan: "family", days: 14 },
    }

    const promo = PROMO_CODES[promoCode?.toUpperCase()]
    if (!promo) return NextResponse.json({ error: "Промо код жарамсыз" }, { status: 400 })

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + promo.days)

    await supabase
      .from("subscriptions")
      .update({
        plan: promo.plan,
        status: "active",
        current_period_end: endDate.toISOString(),
      })
      .eq("user_id", user.id)

    await supabase.from("payments").insert({
      user_id: user.id,
      plan: promo.plan,
      amount: 0,
      status: "success",
      payment_method: "promo",
      transaction_id: promoCode,
    })

    return NextResponse.json({ success: true, plan: promo.plan, days: promo.days })
  }

  // Plan өзгерту
  if (action === "upgrade") {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)

    await supabase
      .from("subscriptions")
      .update({
        plan,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: endDate.toISOString(),
      })
      .eq("user_id", user.id)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
