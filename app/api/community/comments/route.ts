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
  const postId = searchParams.get("post_id")
  if (!postId) return NextResponse.json({ error: "No post_id" }, { status: 400 })

  const { data: comments } = await supabase
    .from("community_comments")
    .select("*, profiles(name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  return NextResponse.json({ comments: comments ?? [] })
}

export async function POST(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { post_id, content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Empty" }, { status: 400 })

  const { data: comment } = await supabase
    .from("community_comments")
    .insert({ post_id, user_id: user.id, content: content.trim() })
    .select("*, profiles(name)")
    .single()

  return NextResponse.json({ comment })
}

export async function DELETE(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  await supabase.from("community_comments").delete().eq("id", id).eq("user_id", user.id)
  return NextResponse.json({ success: true })
}
