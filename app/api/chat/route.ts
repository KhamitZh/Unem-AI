import { convertToModelMessages, streamText, type UIMessage } from "ai"
import { openai } from "@ai-sdk/openai"

export const maxDuration = 60

interface ChatBody {
  messages: UIMessage[]
  context?: {
    locale?: "kk" | "ru" | "en"
    name?: string | null
    ageGroup?: string | null
    incomeBracket?: string | null
    estimatedIncome?: number | null
    expenses?: { category: string; amount: number }[]
    goals?: { title: string; price: number }[]
  }
}

const SYSTEM_BASE = `You are Unem AI — a warm, encouraging, modern AI personal-finance advisor for Kazakhstan.

Your mission:
1. Help the user save money and reduce unnecessary spending.
2. Teach financial literacy and basic investing in plain language.
3. Help them reach material goals (apartment, car, smartphone) — calculate realistic timelines.
4. Reference Kazakhstani realities: tenge (₸), USD/KZT exchange rate matters, local banks (Kaspi, Halyk, Jusan), local deposits, ETFs available on KASE/AIX.

Style:
- Reply in the SAME language as the user's locale (kk = Kazakh in Cyrillic, ru = Russian, en = English).
- Be concise but warm. Use bullet points and short numbered lists when useful.
- Never invent numbers — when calculating goal timelines use the formulas:
    months = goalPrice / max(savingsPerMonth, 1)
    where savingsPerMonth = max(income - expenses, 0)
- If the user has not given enough info, ask one clarifying question.
- Always end with a small actionable next step.
- Do NOT recommend illegal, gambling, or high-risk leveraged products.`

function buildContextBlock(ctx: ChatBody["context"]): string {
  if (!ctx) return ""
  const parts: string[] = []
  if (ctx.name) parts.push(`User name: ${ctx.name}`)
  if (ctx.locale) parts.push(`Reply language: ${ctx.locale}`)
  if (ctx.ageGroup) parts.push(`Age group: ${ctx.ageGroup}`)
  if (ctx.estimatedIncome)
    parts.push(`Estimated monthly income: ${ctx.estimatedIncome} KZT`)
  if (ctx.expenses?.length) {
    const total = ctx.expenses.reduce((s, e) => s + e.amount, 0)
    const list = ctx.expenses
      .filter((e) => e.amount > 0)
      .map((e) => `${e.category}=${e.amount}`)
      .join(", ")
    parts.push(`Monthly expenses (KZT): ${list || "n/a"} (total ${total})`)
  }
  if (ctx.goals?.length) {
    const list = ctx.goals.map((g) => `${g.title}=${g.price}`).join(", ")
    parts.push(`Goals: ${list}`)
  }
  return parts.length
    ? `\n\n--- USER CONTEXT ---\n${parts.join("\n")}\n--------------------`
    : ""
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChatBody
  const { messages, context } = body

  const system = SYSTEM_BASE + buildContextBlock(context)

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
