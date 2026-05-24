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
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const date = searchParams.get("date")

  let query = supabase
    .from("daily_analysis")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true })

  if (date) query = query.eq("date", date)
  if (from) query = query.gte("date", from)
  if (to) query = query.lte("date", to)

  const { data } = await query
  return NextResponse.json({ analysis: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { date, income, expense, income_items, expense_items, note } = await req.json()
  const profit = income - expense

  const { data } = await supabase
    .from("daily_analysis")
    .upsert({
      user_id: user.id,
      date,
      income,
      expense,
      profit,
      income_items: income_items ?? [],
      expense_items: expense_items ?? [],
      note,
    }, { onConflict: "user_id,date" })
    .select()
    .single()

  return NextResponse.json({ analysis: data })
}
