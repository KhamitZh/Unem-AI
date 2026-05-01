"use client"

import { motion } from "framer-motion"
import type { UIMessage } from "ai"
import { AIOrb } from "@/components/ai-orb"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/store"

function getText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

interface Props {
  message: UIMessage
  streaming?: boolean
}

export function MessageBubble({ message, streaming }: Props) {
  const { profile } = useApp()
  const isUser = message.role === "user"
  const text = getText(message)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "group flex gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && <AIOrb size={32} className="mt-1" />}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm md:text-base",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground shadow-glow"
            : "rounded-tl-sm border border-border bg-card/70 text-foreground backdrop-blur",
        )}
      >
        {!isUser && (
          <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            ҮнемАІ
          </div>
        )}
        <div className="whitespace-pre-wrap text-pretty">
          {text}
          {streaming && (
            <span className="ml-0.5 inline-block h-4 w-[2px] -mb-0.5 bg-primary animate-blink align-middle" />
          )}
        </div>
      </div>
      {isUser && (
        <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
          {(profile.name?.[0] ?? "?").toUpperCase()}
        </div>
      )}
    </motion.div>
  )
}
