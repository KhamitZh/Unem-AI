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
  const category = searchParams.get("category")
  const level = searchParams.get("level")
  const search = searchParams.get("search")
  const locale = searchParams.get("locale") ?? "kk"

  let query = supabase.from("books").select("*")

  if (category && category !== "all") query = query.eq("category", category)
  if (level && level !== "all") query = query.eq("level", level)
  if (search) query = query.ilike("title", `%${search}%`)

  const { data: books } = await query.order("title")

  // Пайдаланушының кітап статусын алу
  const { data: userBooks } = await supabase
    .from("user_books")
    .select("*")
    .eq("user_id", user.id)

  const booksWithStatus = (books ?? []).map((book) => ({
  ...book,
  title: locale === "ru" ? (book.title_ru || book.title) : locale === "en" ? (book.title_en || book.title) : book.title,
  benefit: locale === "ru" ? (book.benefit_ru || book.benefit) : locale === "en" ? (book.benefit_en || book.benefit) : book.benefit,
  description: locale === "ru" ? (book.description_ru || book.description) : locale === "en" ? (book.description_en || book.description) : book.description,
  userStatus: userBooks?.find((ub) => ub.book_id === book.id) ?? null,
  }))

  return NextResponse.json({ books: booksWithStatus })
}

export async function POST(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { bookId, status, rating } = await req.json()

  const { data } = await supabase
    .from("user_books")
    .upsert({
      user_id: user.id,
      book_id: bookId,
      status,
      rating,
    }, { onConflict: "user_id,book_id" })
    .select()
    .single()

  return NextResponse.json({ userBook: data })
}
