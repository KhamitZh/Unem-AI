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

export function ChatScreen() {
  const { profile, expenses, goals } = useApp()
  const locale = profile.locale
  const { theme, setTheme } = useTheme()
  const [input, setInput] = useState("")
  const scrollerRef = useRef<HTMLDivElement>(null)

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
              estimatedIncome: profile.estimatedIncome,
              expenses: expenses.map((e) => ({
                category: e.category,
                amount: e.amount,
              })),
              goals: goals.map((g) => ({ title: g.title, price: g.price })),
            },
          },
        }),
      }),
    [profile, expenses, goals],
  )

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
  })

  const isStreaming = status === "streaming" || status === "submitted"

  // auto-scroll
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages, isStreaming])

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    sendMessage({ text: trimmed })
    setInput("")
  }

  function newChat() {
    setMessages([])
    setInput("")
  }

  const empty = messages.length === 0

  return (
    <main className="relative flex h-dvh w-full overflow-hidden">
      {/* ambient bg layer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-mesh opacity-60"
      />

      <ChatSidebar onNewChat={newChat} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-background/40 px-3 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9 rounded-full">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-4">
                <SheetHeader className="p-0 pb-3">
                  <SheetTitle asChild>
                    <AIWordmark />
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-2">
                  <Button
                    onClick={newChat}
                    className="mb-3 h-10 w-full rounded-xl"
                    variant="outline"
                  >
                    {t(locale, "newChat")}
                  </Button>
                  <ProfileCard />
                </div>
              </SheetContent>
            </Sheet>
            <AIWordmark />
          </div>

          <div className="hidden items-center gap-2.5 md:flex">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">
              {t(locale, "online")} · gpt-5-mini
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-1.5 rounded-full">
                  <Globe className="size-4" />
                  <span className="hidden text-xs sm:inline">
                    {LOCALE_LABEL[locale]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(LOCALE_LABEL) as Locale[]).map((l) => (
                  <DropdownMenuItem
                    key={l}
                    onClick={() => useApp.getState().setLocale(l)}
                    className={cn(locale === l && "bg-accent/40")}
                  >
                    {LOCALE_LABEL[l]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          </div>
        </header>

        {/* messages / empty state */}
        <div
          ref={scrollerRef}
          className="nice-scroll flex-1 overflow-y-auto"
        >
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

        {/* composer */}
        <div className="border-t border-border/60 bg-background/40 backdrop-blur">
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
