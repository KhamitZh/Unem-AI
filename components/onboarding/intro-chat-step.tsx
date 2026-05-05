"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AIOrb } from "@/components/ai-orb"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

interface Props {
  variant: "expenses" | "goals"
}

/**
 * Two-step guided intro: AI asks a question, user replies.
 * The reply is parsed and saved to the store, then we move on.
 */
export function IntroChatStep({ variant }: Props) {
  const { profile, setStep, addExpensesFromText, addGoalFromText } = useApp()
  const locale = profile.locale
  const [draft, setDraft] = useState("")
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [typed, setTyped] = useState("")
  const taRef = useRef<HTMLTextAreaElement>(null)

  const aiMessage =
    variant === "expenses"
      ? t(locale, "introExpensesAi")
      : t(locale, "introGoalsAi")
  const placeholder =
    variant === "expenses"
      ? t(locale, "expensesPlaceholder")
      : t(locale, "goalsPlaceholder")

  // typewriter effect
  useEffect(() => {
    setTyped("")
    let i = 0
    const id = setInterval(() => {
      i++
      setTyped(aiMessage.slice(0, i))
      if (i >= aiMessage.length) clearInterval(id)
    }, 14)
    return () => clearInterval(id)
  }, [aiMessage])

  function submit() {
    const text = draft.trim()
    if (!text) return
    setSubmitted(text)
    if (variant === "expenses") {
      addExpensesFromText(text)
      setTimeout(() => setStep("intro-goals"), 700)
    } else {
      addGoalFromText(text)
      setTimeout(() => setStep("done"), 700)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex w-full max-w-2xl flex-col"
    >
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={() =>
            variant === "expenses"
              ? setStep("income")
              : setStep("intro-expenses")
          }
        >
          <ArrowLeft className="mr-1.5 size-4" />
          {t(locale, "back")}
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          {t(locale, "online")}
        </div>
      </div>

      {/* AI bubble */}
      <div className="flex items-start gap-3">
        <AIOrb size={40} />
        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border bg-card/70 p-4 leading-relaxed shadow-sm backdrop-blur">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Unem AI
          </div>
          <p className="mt-1 text-pretty">
            {typed}
            {typed.length < aiMessage.length && (
              <span className="ml-0.5 inline-block h-4 w-[2px] -mb-0.5 bg-primary animate-blink align-middle" />
            )}
          </p>
        </div>
      </div>

      {/* User reply (after submit) */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 flex justify-end"
          >
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground shadow-glow">
              {submitted}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      {!submitted && (
        <div className="mt-6 rounded-2xl border border-border bg-card/70 p-2 shadow-sm backdrop-blur">
          <Textarea
            ref={taRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={placeholder}
            className="min-h-[88px] resize-none border-0 bg-transparent px-3 py-2 text-base shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <p className="text-[11px] text-muted-foreground">
              ⏎ — {t(locale, "send")} · ⇧⏎ — new line
            </p>
            <Button
              type="button"
              size="sm"
              onClick={submit}
              disabled={!draft.trim()}
              className="rounded-full px-4 shadow-glow"
            >
              <Send className="mr-1.5 size-3.5" />
              {t(locale, "send")}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
