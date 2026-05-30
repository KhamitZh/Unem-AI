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
  const category = searchParams.get("category") ?? "all"

  let query = supabase
    .from("community_posts")
    .select("*, profiles(name)")
    .order("created_at", { ascending: false })
    .limit(50)

  if (category !== "all") query = query.eq("category", category)

  const { data: posts } = await query

  // Лайктарды алу
  const { data: likes } = await supabase
    .from("community_likes")
    .select("post_id")
    .eq("user_id", user.id)

  const likedPostIds = new Set(likes?.map((l) => l.post_id))

  const postsWithLikes = (posts ?? []).map((post) => ({
    ...post,
    isLiked: likedPostIds.has(post.id),
  }))

  return NextResponse.json({ posts: postsWithLikes })
}

export async function POST(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action, content, category, postId } = await req.json()

  // Жаңа пост
  if (action === "create") {
    if (!content?.trim()) return NextResponse.json({ error: "Empty" }, { status: 400 })

    const { data: post } = await supabase
      .from("community_posts")
      .insert({
        user_id: user.id,
        content: content.trim(),
        category: category ?? "general",
      })
      .select("*, profiles(name)")
      .single()

    return NextResponse.json({ post })
  }

  // Лайк
  if (action === "like") {
    const { data: existing } = await supabase
      .from("community_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single()

    if (existing) {
      await supabase.from("community_likes").delete().eq("id", existing.id)
      await supabase.from("community_posts").update({ likes: supabase.rpc("decrement", { x: 1 }) }).eq("id", postId)
      return NextResponse.json({ liked: false })
    } else {
      await supabase.from("community_likes").insert({ user_id: user.id, post_id: postId })
      await supabase.from("community_posts")
        .update({ likes: (await supabase.from("community_posts").select("likes").eq("id", postId).single()).data?.likes + 1 })
        .eq("id", postId)
      return NextResponse.json({ liked: true })
    }
  }

  // Жою
  if (action === "delete") {
    await supabase.from("community_posts").delete().eq("id", postId).eq("user_id", user.id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
