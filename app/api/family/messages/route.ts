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

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single()

  if (!membership) return NextResponse.json({ messages: [] })

  const { data: messages } = await supabase
    .from("family_messages")
    .select("*, profiles(name)")
    .eq("family_id", membership.family_id)
    .order("created_at", { ascending: true })
    .limit(50)

  return NextResponse.json({ messages: messages ?? [] })
}

export async function POST(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Empty" }, { status: 400 })

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single()

  if (!membership) return NextResponse.json({ error: "No family" }, { status: 400 })

  const { data: message } = await supabase
    .from("family_messages")
    .insert({
      family_id: membership.family_id,
      user_id: user.id,
      content: content.trim(),
    })
    .select("*, profiles(name)")
    .single()

  return NextResponse.json({ message })
}
