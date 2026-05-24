import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: Request) {
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

  const { text, date } = await req.json()

  const prompt = `Parse this financial message and extract income and expenses.
Message: "${text}"
Today's date: ${date}

Return ONLY a JSON object, no other text:
{
  "income": 15000,
  "expense": 16000,
  "income_items": [
    {"name": "кішігірім жұмыс", "amount": 15000}
  ],
  "expense_items": [
    {"name": "киім", "amount": 11000},
    {"name": "тамақ", "amount": 3000},
    {"name": "жол", "amount": 2000}
  ]
}

Rules:
- Extract ALL income and expense items mentioned
- Amounts must be numbers only (no currency symbols)
- Item names should be in the same language as the message
- If no income mentioned, income = 0
- If no expense mentioned, expense = 0`

  try {
    const { text: aiText } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    })

    const jsonMatch = aiText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: "Parse failed" }, { status: 400 })

    const parsed = JSON.parse(jsonMatch[0])
    const profit = parsed.income - parsed.expense

    // Supabase-ке сақтау
    await supabase.from("daily_analysis").upsert({
      user_id: user.id,
      date,
      income: parsed.income,
      expense: parsed.expense,
      profit,
      income_items: parsed.income_items,
      expense_items: parsed.expense_items,
    }, { onConflict: "user_id,date" })

    return NextResponse.json({ ...parsed, profit })
  } catch (e) {
    return NextResponse.json({ error: "AI error" }, { status: 500 })
  }
}
