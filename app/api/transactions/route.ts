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

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(100)

  return NextResponse.json({ transactions: transactions ?? [] })
}

export async function POST(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { transactions } = await req.json()

  const toInsert = transactions.map((t: any) => ({
    user_id: user.id,
    title: t.title,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: t.date,
    source: t.source ?? "manual",
    raw_text: t.raw_text,
  }))

  const { data } = await supabase
    .from("transactions")
    .insert(toInsert)
    .select()

  return NextResponse.json({ transactions: data })
}

export async function DELETE(req: Request) {
  const supabase = await getSupabase()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id)
  return NextResponse.json({ success: true })
}
