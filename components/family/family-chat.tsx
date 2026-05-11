"use client"

import { useEffect, useRef, useState } from "react"
import { Send, MessageSquare } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

interface Message {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: { name: string } | null
}

export function FamilyChat({ currentUserId }: { currentUserId: string }) {
  const { profile } = useApp()
  const locale = profile.locale
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function loadMessages() {
    const res = await fetch("/api/family/messages")
    const data = await res.json()
    if (data.messages) setMessages(data.messages)
  }

  async function handleSend() {
    if (!input.trim() || sending) return
    setSending(true)
    const res = await fetch("/api/family/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim() }),
    })
    const data = await res.json()
    if (data.message) {
      setMessages((prev) => [...prev, data.message])
      setInput("")
    }
    setSending(false)
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString(
      locale === "kk" ? "kk-KZ" : locale === "ru" ? "ru-RU" : "en-US",
      { hour: "2-digit", minute: "2-digit" }
    )
  }

  const chatLabel = locale === "kk" ? "Отбасылық чат" : locale === "ru" ? "Семейный чат" : "Family chat"
  const placeholder = locale === "kk" ? "Хабарлама жазыңыз..." : locale === "ru" ? "Напишите сообщение..." : "Write a message..."

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MessageSquare className="size-4 text-primary" />
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{chatLabel}</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-64 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">
            {locale === "kk" ? "Хабарлама жоқ" : locale === "ru" ? "Нет сообщений" : "No messages"}
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {!isMe && (
                  <p className="text-[10px] text-muted-foreground px-1">
                    {msg.profiles?.name ?? "—"}
                  </p>
                )}
                <div className={`rounded-2xl px-3 py-2 text-sm ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted/50 text-foreground rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
                <p className="text-[10px] text-muted-foreground px-1">{formatTime(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  )
}
