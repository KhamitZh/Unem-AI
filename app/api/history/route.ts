import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const cookieStore = await cookies()
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("session_id")

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

  let query = supabase
    .from("messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (sessionId) query = query.eq("session_id", sessionId)

  const { data: messages } = await query

  return NextResponse.json({ messages })
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const { role, content, session_id } = await req.json()

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

  await supabase.from("messages").insert({
    user_id: user.id,
    role,
    content,
    session_id,
  })

  // Session updated_at жаңарту
  if (session_id) {
    await supabase
      .from("sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", session_id)
  }

  return NextResponse.json({ success: true })
}