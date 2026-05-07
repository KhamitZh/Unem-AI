import { convertToModelMessages, streamText, type UIMessage } from "ai"
import { openai } from "@ai-sdk/openai"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

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
- Do NOT recommend illegal, gambling, or high-risk leveraged products.

MEMORY INSTRUCTIONS:
- You have access to user memories from previous conversations.
- Use these memories to personalize your advice.
- If you learn new important facts about the user (new job, new goal, income change, spending habit), 
  output a special JSON block at the END of your response like this:
  <memory_update>
  [
    {"key": "job", "value": "software engineer"},
    {"key": "main_goal", "value": "buy apartment in Almaty for 25M tenge"},
    {"key": "spending_habit", "value": "spends too much on cafes"}
  ]
  </memory_update>
- Keys should be short english words. Values should be concise.
- Only output memory_update when you learn something NEW and IMPORTANT.`

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

function buildMemoryBlock(memories: { key: string; value: string }[]): string {
  if (!memories.length) return ""
  const list = memories.map((m) => `${m.key}: ${m.value}`).join("\n")
  return `\n\n--- USER MEMORIES (from previous conversations) ---\n${list}\n---------------------------------------------------`
}

async function getUserMemories(req: Request) {
  try {
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
    if (!user) return []

    const { data } = await supabase
      .from("memories")
      .select("key, value")
      .eq("user_id", user.id)

    return data ?? []
  } catch {
    return []
  }
}

async function saveMemories(updates: { key: string; value: string }[], req: Request) {
  try {
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
    if (!user) return

    for (const { key, value } of updates) {
      await supabase.from("memories").upsert(
        { user_id: user.id, key, value, updated_at: new Date().toISOString() },
        { onConflict: "user_id,key" }
      )
    }
  } catch (e) {
    console.error("Memory save error:", e)
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChatBody
  const { messages, context } = body

  const memories = await getUserMemories(req)
  const system = SYSTEM_BASE + buildMemoryBlock(memories) + buildContextBlock(context)

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system,
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      // Memory update жадын сақтау
      const match = text.match(/<memory_update>([\s\S]*?)<\/memory_update>/)
      if (match) {
        try {
          const updates = JSON.parse(match[1].trim())
          if (Array.isArray(updates)) {
            await saveMemories(updates, req)
          }
        } catch (e) {
          console.error("Memory parse error:", e)
        }
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
