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

  const formData = await req.formData()
  const file = formData.get("pdf") as File
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  // PDF мәтінін оқу
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let pdfText = ""
  try {
    const pdfModule = await import("pdf-parse")
    const pdfParse = (pdfModule as any).default || (pdfModule as any)
    const data = await pdfParse(buffer)
    pdfText = data.text
  } catch (e) {
    return NextResponse.json({ error: "PDF оқу қатесі" }, { status: 400 })
  }

  if (!pdfText.trim()) {
    return NextResponse.json({ error: "PDF бос" }, { status: 400 })
  }

  // AI арқылы транзакцияларды оқу
  const prompt = `Parse this Kaspi Bank statement and extract all transactions. Return ONLY a JSON array, no other text:

${pdfText.slice(0, 4000)}

Return format:
[{"title": "merchant name", "amount": 1000, "type": "expense|income", "category": "food|transport|entertainment|shopping|health|salary|transfer|other", "date": "YYYY-MM-DD"}]

Rules:
- Negative amounts or debits = expense
- Positive amounts or credits = income
- Date format must be YYYY-MM-DD
- Extract maximum 50 transactions
- category must be one of: food, transport, entertainment, shopping, health, salary, transfer, other`

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    })

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ error: "Парсинг қатесі" }, { status: 400 })

    const transactions = JSON.parse(jsonMatch[0])
    return NextResponse.json({ transactions })
  } catch (e) {
    return NextResponse.json({ error: "AI қатесі" }, { status: 500 })
  }
}
