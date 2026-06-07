"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { Globe, Moon, Sun, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AIOrb, AIWordmark } from "@/components/ai-orb"
import { useApp } from "@/lib/store"
import { LOCALE_LABEL, t } from "@/lib/i18n"
import type { Locale } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ChatSidebar } from "./chat-sidebar"
import { Composer } from "./composer"
import { MessageBubble } from "./message-bubble"
import { ProfileCard } from "./profile-card"
import { Suggestions } from "./suggestions"
import { NotificationBanner } from "./notification-banner"
import { GoalChecker } from "./goal-checker"
import { BottomNav } from "./bottom-nav"
import { useSubscription } from "@/lib/use-subscription"
import { UpgradeModal } from "@/components/subscription/upgrade-modal"
import { SubscriptionBadge } from "@/components/subscription/subscription-badge"
import { FunctionsPanel } from "./functions-panel"
import { History } from "lucide-react"

export function ChatScreen() {
  const { profile, expenses, goals } = useApp()
  const locale = profile.locale
  const { theme, setTheme } = useTheme()
  const [input, setInput] = useState("")
  const { canChat, incrementChat, chatMessagesLeft, isPro } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showFunctions, setShowFunctions] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"chat" | "finance" | "goal" | "family" | "csv" | "analytics">("chat")  
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [dbFinances, setDbFinances] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/finances")
      .then((r) => r.json())
      .then((d) => setDbFinances(d.finances ?? []))
  }, [])
  const [sessions, setSessions] = useState<any[]>([])
  const scrollerRef = useRef<HTMLDivElement>(null)
  const prevStreamingRef = useRef(false)

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            context: {
              locale: profile.locale,
              name: profile.name,
              ageGroup: profile.ageGroup,
              incomeBracket: profile.incomeBracket,
              estimatedIncome: dbFinances
                .filter((f) => f.type === "income")
                .reduce((s, i) => s + i.amount, 0) || profile.estimatedIncome,
              expenses: dbFinances
                .filter((f) => f.type === "expense")
                .map((e) => ({ category: e.title, amount: e.amount }))
                .concat(expenses.map((e) => ({ category: e.category, amount: e.amount }))),
              goals: dbFinances
                .filter((f) => f.type === "goal")
                .map((g) => ({ title: g.title, price: g.amount }))
                .concat(goals.map((g) => ({ title: g.title, price: g.price }))),
            },
          },
        }),
      }),
    [profile, expenses, goals, dbFinances],
  )

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
  })

  const isStreaming = status === "streaming" || status === "submitted"

  // Сессиялар тізімін жүктеу
  useEffect(() => {
    async function loadSessions() {
      const res = await fetch("/api/sessions")
      const data = await res.json()
      if (data.sessions?.length) {
        setSessions(data.sessions)
      }
    }
    loadSessions()
  }, [])

  // Сессия хабарламаларын жүктеу
  useEffect(() => {
    if (!sessionId) return
    async function loadHistory() {
      const res = await fetch(`/api/history?session_id=${sessionId}`)
      const data = await res.json()
      if (data.messages?.length) {
        setMessages(
          data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: "text", text: m.content }],
          }))
        )
      } else {
        setMessages([])
      }
    }
    loadHistory()
  }, [sessionId])

  // AI жауабын сақтау
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming && messages.length > 0) {
      const last = messages[messages.length - 1]
      if (last.role === "assistant") {
        const text = last.parts
          ?.filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("")
        if (text && sessionId) {
          fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: "assistant",
              content: text,
              session_id: sessionId,
            }),
          })
        }
      }
    }
    prevStreamingRef.current = isStreaming
  }, [isStreaming, messages, sessionId])

  // Auto-scroll
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages, isStreaming])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    // Лимит тексеру
    if (!canChat()) {
      setUpgradeReason("chat")
      setShowUpgrade(true)
      return
    }

    await incrementChat()

    let currentSessionId = sessionId

    // Жаңа сессия жасау
    if (!currentSessionId) {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed.slice(0, 50) }),
      })
      const data = await res.json()
      if (!data.session) {
        console.error("Session жасалмады:", data)
        return
      }
      currentSessionId = data.session.id
      setSessionId(currentSessionId)
      setSessions((prev) => [data.session, ...prev])
    }

    // Пайдаланушы хабарын сақтау
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "user",
        content: trimmed,
        session_id: currentSessionId,
      }),
    })

    sendMessage({ text: trimmed })
    setInput("")
  }

  function newChat() {
    setMessages([])
    setInput("")
    setSessionId(null)
  }
  async function deleteSession(id: string) {
  await fetch(`/api/sessions?id=${id}`, { method: "DELETE" })
  setSessions((prev) => prev.filter((s) => s.id !== id))
    if (sessionId === id) {
      setMessages([])
      setSessionId(null)
    }
  }

  async function renameSession(id: string, title: string) {
    await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title }),
    })
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    )
  }

  async function pinSession(id: string, pinned: boolean) {
    await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned }),
    })
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned } : s))
    )
  }

  const empty = messages.length === 0

  return (
    <main className="relative flex h-dvh w-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-mesh opacity-60"
      />
      <BottomNav onFunctionsClick={() => setShowFunctions(true)} />
      <FunctionsPanel open={showFunctions} onClose={() => setShowFunctions(false)} />
      <NotificationBanner />
      <GoalChecker />
      <ChatSidebar showMobile={showMobileSidebar} onMobileClose={() => setShowMobileSidebar(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-background/80 backdrop-blur-xl">
          {/* Mobile sidebar батырмасы */}
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="md:hidden size-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <History className="size-4 text-white/60" />
          </button>

          {/* Лого + Аты */}
          <div className="flex items-center gap-2.5 flex-1">
            <img src="/logo.png" alt="Unem AI" className="size-8 rounded-xl object-cover" />
            <div>
              <p className="font-bold text-sm text-white leading-none">Unem AI</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`size-1.5 rounded-full animate-pulse ${canChat() ? "bg-green-400" : "bg-red-400"}`} />
                <span className="text-[10px] text-white/40">
                  {canChat()
                    ? (profile.locale === "kk" ? "онлайн" : profile.locale === "ru" ? "онлайн" : "online")
                    : (profile.locale === "kk" ? "лимит бітті" : profile.locale === "ru" ? "лимит" : "limit")}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription badge */}
          <SubscriptionBadge onClick={() => setShowUpgrade(true)} />
        </header>

        <div ref={scrollerRef} className="nice-scroll flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">
            {empty ? (
              <EmptyState onPick={(s) => send(s)} userName={profile.name} />
            ) : (
              <div className="flex flex-col gap-5 pb-6">
                {messages.map((m, i) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    streaming={
                      isStreaming &&
                      i === messages.length - 1 &&
                      m.role === "assistant"
                    }
                  />
                ))}
                {status === "submitted" &&
                  messages[messages.length - 1]?.role === "user" && (
                    <ThinkingBubble />
                  )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/60 bg-background/40 backdrop-blur mb-16 md:mb-0">
          <div className="mx-auto w-full max-w-3xl px-3 py-3 md:px-8 md:py-4">
            <Composer
              value={input}
              onChange={setInput}
              onSubmit={() => send(input)}
              onStop={stop}
              loading={isStreaming}
            />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {t(locale, "poweredBy")} · {t(locale, "brand")} v1.0
            </p>
          </div>
        </div>
      </div>
      {showUpgrade && (
        <UpgradeModal
          reason={upgradeReason}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </main>
  )
}

function ThinkingBubble() {
  const { profile } = useApp()
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      <AIOrb size={32} />
      <div className="rounded-2xl rounded-tl-sm border border-border bg-card/70 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary" />
          <span className="ml-2">{t(profile.locale, "thinking")}</span>
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState({
  onPick,
  userName,
}: {
  onPick: (s: string) => void
  userName: string | null
}) {
  const { profile } = useApp()
  const locale = profile.locale
  const greeting =
    locale === "kk"
      ? `Сәлем, ${userName ?? "дос"}!`
      : locale === "ru"
        ? `Привет, ${userName ?? "друг"}!`
        : `Hi, ${userName ?? "friend"}!`
  return (
    <div className="mx-auto flex min-h-[60vh] w-full flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <AIOrb size={84} />
      </motion.div>
      <h1 className="font-display text-balance text-3xl tracking-tight md:text-4xl">
        <span className="text-gradient">{greeting}</span>
      </h1>
      <p className="mt-2 max-w-md text-pretty text-sm text-muted-foreground md:text-base">
        {t(locale, "finishOnboarding")}
      </p>
      <div className="mt-8 w-full max-w-xl">
        <div className="mb-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {t(locale, "suggestions")}
        </div>
        <Suggestions onPick={onPick} />
      </div>
    </div>
  )
}