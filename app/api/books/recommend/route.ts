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

  const { problem, finances } = await req.json()

  // Барлық кітаптарды алу
  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, description, benefit, category, level, tags")

  // Пайдаланушының оқыған кітаптарын алу
  const { data: userBooks } = await supabase
    .from("user_books")
    .select("book_id, status")
    .eq("user_id", user.id)

  const readBookIds = userBooks?.map((ub) => ub.book_id) ?? []

  // Оқылмаған кітаптар
  const unreadBooks = (books ?? []).filter((b) => !readBookIds.includes(b.id))

  const booksList = unreadBooks.map((b) =>
    `ID:${b.id} | ${b.title} by ${b.author} | Category:${b.category} | Level:${b.level} | Benefit:${b.benefit}`
  ).join("\n")

  const prompt = `You are a financial book advisor. Based on the user's problem and financial situation, recommend TOP 5 most relevant books from the list below.

User's problem: "${problem}"
User's finances: ${JSON.stringify(finances)}

Available books:
${booksList}

Return ONLY a JSON array with exactly 5 book IDs and reasons, no other text:
[
  {"id": "uuid-here", "reason": "1-2 sentence explanation why this book fits the user's specific problem in their language"},
  ...
]

Important:
- Match books to the SPECIFIC problem mentioned
- Reason must be in the SAME language as the problem (Kazakh/Russian/English)
- Prioritize beginner books if user seems new to finance
- Consider user's income/expenses/goals when selecting`

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 1000,
    })

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ error: "Parse failed" }, { status: 400 })

    const recommendations = JSON.parse(jsonMatch[0])

    // Кітап деректерін қосу
    const result = recommendations.map((rec: any) => {
      const book = books?.find((b) => b.id === rec.id)
      return { ...book, reason: rec.reason }
    }).filter(Boolean)

    return NextResponse.json({ books: result })
  } catch (e) {
    return NextResponse.json({ error: "AI error" }, { status: 500 })
  }
}
