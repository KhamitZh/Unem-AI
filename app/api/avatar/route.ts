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

export async function POST(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("avatar") as File
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  // Файл өлшемін тексеру (макс 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 })
  }

  // Файл форматын тексеру
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Invalid format (jpg/png/webp only)" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `${user.id}/avatar.${ext}`

  // Ескі аватарды өшіру
  await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`])

  // Жаңа аватарды жүктеу
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // Public URL алу
  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)

  // Profiles кестесіне сақтау
  await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id)

  return NextResponse.json({ avatarUrl: publicUrl })
}

export async function DELETE() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await supabase.storage.from("avatars").remove([
    `${user.id}/avatar.jpg`,
    `${user.id}/avatar.png`,
    `${user.id}/avatar.webp`,
  ])

  await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id)
  return NextResponse.json({ success: true })
}
