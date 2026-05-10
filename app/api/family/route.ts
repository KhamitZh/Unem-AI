import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  const cookieStore = await cookies()
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

  // Пайдаланушының отбасысын табу
  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id, role, families(id, name, owner_id)")
    .eq("user_id", user.id)
    .single()

  if (!membership) return NextResponse.json({ family: null })

  const family = membership.families as any

  // Отбасы мүшелерін алу
  const { data: members } = await supabase
    .from("family_members")
    .select("user_id, role, joined_at, profiles(name)")
    .eq("family_id", family.id)

  // Мүшелердің қаржысын алу
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

  return NextResponse.json({
    family: {
      ...family,
      role: membership.role,
      members: memberFinances,
    },
  })
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const { action, name, email, token } = await req.json()

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

  // Отбасы жасау
  if (action === "create") {
    const { data: family } = await supabase
      .from("families")
      .insert({ name, owner_id: user.id })
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
    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id, families(name)")
      .eq("user_id", user.id)
      .single()

    if (!membership) return NextResponse.json({ error: "No family" }, { status: 400 })

    const inviteToken = crypto.randomUUID()
    await supabase.from("family_invites").insert({
      family_id: membership.family_id,
      email,
      token: inviteToken,
    })

    const familyName = (membership.families as any)?.name ?? "Отбасы"
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://unem-ai.vercel.app"}/family/join?token=${inviteToken}`

    await resend.emails.send({
      from: "Unem AI <onboarding@resend.dev>",
      to: email,
      subject: `🏠 Сізді "${familyName}" отбасылық бюджетіне шақырды`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f1117;color:white;border-radius:16px;">
          <h1 style="color:#6366f1;">Unem AI</h1>
          <p>Сізді <strong>${familyName}</strong> отбасылық бюджетіне қосылуға шақырды!</p>
          <a href="${inviteUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0;">
            Қосылу →
          </a>
          <p style="color:#9ca3af;font-size:12px;">Сілтеме 7 күн жарамды</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  }

  // Отбасыға қосылу
  if (action === "join") {
    const { data: invite } = await supabase
      .from("family_invites")
      .select("*")
      .eq("token", token)
      .single()

    if (!invite) return NextResponse.json({ error: "Invalid token" }, { status: 400 })

    const now = new Date()
    if (new Date(invite.expires_at) < now) {
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
