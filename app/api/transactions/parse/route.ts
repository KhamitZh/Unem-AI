import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(req: Request) {
  const { type, content } = await req.json()

  let prompt = ""

  if (type === "sms") {
    prompt = `Parse this bank SMS and extract transaction info. Return JSON array only, no other text:
SMS: "${content}"

Return format:
[{"title": "merchant name", "amount": 1000, "type": "expense|income", "category": "food|transport|entertainment|salary|other", "date": "YYYY-MM-DD"}]

Rules:
- If amount is withdrawn/spent = expense
- If amount is received/credited = income  
- Date format must be YYYY-MM-DD
- If date not found use today: ${new Date().toISOString().split("T")[0]}
- category must be one of: food, transport, entertainment, shopping, health, salary, transfer, other`
  }

  if (type === "csv") {
    prompt = `Parse this Kaspi/Halyk bank CSV statement and extract transactions. Return JSON array only, no other text:

CSV content:
${content.slice(0, 3000)}

Return format:
[{"title": "merchant name", "amount": 1000, "type": "expense|income", "category": "food|transport|entertainment|salary|other", "date": "YYYY-MM-DD"}]

Rules:
- Negative amounts or debits = expense
- Positive amounts or credits = income
- Date format must be YYYY-MM-DD
- category must be one of: food, transport, entertainment, shopping, health, salary, transfer, other
- Return maximum 50 transactions`
  }

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 2000,
    })

    // JSON парсинг
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ error: "Parse failed" }, { status: 400 })

    const transactions = JSON.parse(jsonMatch[0])
    return NextResponse.json({ transactions })
  } catch (e) {
    return NextResponse.json({ error: "AI parse error" }, { status: 500 })
  }
}
