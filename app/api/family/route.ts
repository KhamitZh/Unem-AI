import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

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

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id, role, families(id, name, owner_id, max_admins)")
    .eq("user_id", user.id)
    .single()

  if (!membership) return NextResponse.json({ family: null })

  const family = membership.families as any

  const { data: members } = await supabase
    .from("family_members")
    .select("user_id, role, joined_at, profiles(name)")
    .eq("family_id", family.id)

  const memberFinances = await Promise.all(
    (members ?? []).map(async (m: any) => {
      const { data: finances } = await supabase
        .from("finances")
        .select("*")
        .eq("user_id", m.user_id)

      const incomes = (finances ?? []).filter((f) => f.type === "income")
      const expenses = (finances ?? []).filter((f) => f.type === "expense")
      const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

      return {
        user_id: m.user_id,
        name: (m.profiles as any)?.name ?? "—",
        role: m.role,
        totalIncome,
        totalExpenses,
        savings: Math.max(totalIncome - totalExpenses, 0),
      }
    })
  )

  // Ортақ мақсаттар
  const { data: familyGoals } = await supabase
    .from("family_goals")
    .select("*")
    .eq("family_id", family.id)

  // Ортақ мақсатқа салымдар
  const goalsWithContributions = await Promise.all(
    (familyGoals ?? []).map(async (goal: any) => {
      const { data: contributions } = await supabase
        .from("family_contributions")
        .select("*, profiles(name)")
        .eq("goal_id", goal.id)

      return { ...goal, contributions: contributions ?? [] }
    })
  )

  return NextResponse.json({
    family: {
      ...family,
      role: membership.role,
      members: memberFinances,
      goals: goalsWithContributions,
    },
  })
}

export async function POST(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { action } = body

  // Отбасы жасау
  if (action === "create") {
    const { name } = body
    const { data: family } = await supabase
      .from("families")
      .insert({ name, owner_id: user.id, max_admins: 3 })
      .select()
      .single()

    await supabase.from("family_members").insert({
      family_id: family!.id,
      user_id: user.id,
      role: "admin",
    })

    return NextResponse.json({ family })
  }

  // Мүше шақыру
  if (action === "invite") {
    const { email } = body

    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id, role, families(name)")
      .eq("user_id", user.id)
      .single()

    if (!membership) return NextResponse.json({ error: "No family" }, { status: 400 })
    if (membership.role !== "admin") return NextResponse.json({ error: "Not admin" }, { status: 403 })

    const inviteToken = crypto.randomUUID()
    await supabase.from("family_invites").insert({
      family_id: membership.family_id,
      email,
      token: inviteToken,
    })

    const familyName = (membership.families as any)?.name ?? "Отбасы"
    const inviteUrl = `https://unem-ai.vercel.app/family/join?token=${inviteToken}`

    await resend.emails.send({
      from: "Unem AI <onboarding@resend.dev>",
      to: email,
      subject: `🏠 Сізді "${familyName}" отбасылық бюджетіне шақырды`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f1117;color:white;border-radius:16px;">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
            <h1 style="margin:0;color:white;">Unem AI</h1>
          </div>
          <h2 style="color:#e5e7eb;">Отбасылық бюджетке шақыру</h2>
          <p style="color:#9ca3af;">Сізді <strong style="color:white;">${familyName}</strong> отбасылық бюджетіне қосылуға шақырды!</p>
          <p style="color:#9ca3af;">Барлық отбасы мүшелерімен бірге қаржыңызды басқарыңыз, ортақ мақсаттарға жетіңіз!</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${inviteUrl}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:600;font-size:16px;">
              ✅ Қосылу
            </a>
          </div>
          <p style="color:#6b7280;font-size:12px;text-align:center;">Сілтеме 7 күн жарамды · Unem AI</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  }

  // Отбасыға қосылу
  if (action === "join") {
    const { token } = body
    const { data: invite } = await supabase
      .from("family_invites")
      .select("*")
      .eq("token", token)
      .single()

    if (!invite) return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 })
    }

    await supabase.from("family_members").upsert({
      family_id: invite.family_id,
      user_id: user.id,
      role: "member",
    })

    await supabase.from("family_invites").delete().eq("token", token)
    return NextResponse.json({ success: true, family_id: invite.family_id })
  }

  // Admin тағайындау
  if (action === "makeAdmin") {
    const { targetUserId } = body

    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id, role, families(max_admins)")
      .eq("user_id", user.id)
      .single()

    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Not admin" }, { status: 403 })
    }

    // Admin санын тексеру
    const { data: admins } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", membership.family_id)
      .eq("role", "admin")

    const maxAdmins = (membership.families as any)?.max_admins ?? 3
    if ((admins?.length ?? 0) >= maxAdmins) {
      return NextResponse.json({ error: "Max admins reached" }, { status: 400 })
    }

    await supabase
      .from("family_members")
      .update({ role: "admin" })
      .eq("user_id", targetUserId)
      .eq("family_id", membership.family_id)

    return NextResponse.json({ success: true })
  }

  // Ортақ мақсат жасау
  if (action === "createGoal") {
    const { title, targetAmount } = body

    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id, role")
      .eq("user_id", user.id)
      .single()

    if (!membership) return NextResponse.json({ error: "No family" }, { status: 400 })

    const { data: goal } = await supabase
      .from("family_goals")
      .insert({
        family_id: membership.family_id,
        title,
        target_amount: targetAmount,
        created_by: user.id,
      })
      .select()
      .single()

    return NextResponse.json({ goal })
  }

  // Ортақ мақсатқа салым қосу
  if (action === "contribute") {
    const { goalId, amount } = body

    await supabase.from("family_contributions").insert({
      goal_id: goalId,
      user_id: user.id,
      amount,
    })

    return NextResponse.json({ success: true })
  }

  // Отбасыдан шығу
  if (action === "leave") {
    await supabase
      .from("family_members")
      .delete()
      .eq("user_id", user.id)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
