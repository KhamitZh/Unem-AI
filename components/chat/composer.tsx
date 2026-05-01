"use client"

import { useEffect, useRef } from "react"
import { ArrowUp, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onStop?: () => void
  loading?: boolean
}

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  loading,
}: Props) {
  const { profile } = useApp()
  const ref = useRef<HTMLTextAreaElement>(null)

  // auto-grow
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "0px"
    el.style.height = Math.min(el.scrollHeight, 220) + "px"
  }, [value])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!loading && value.trim()) onSubmit()
      }}
      className="relative rounded-3xl border border-border bg-card/80 p-2 shadow-lg backdrop-blur-xl transition-shadow focus-within:shadow-glow"
    >
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (!loading && value.trim()) onSubmit()
          }
        }}
        rows={1}
        placeholder={t(profile.locale, "chatPlaceholder")}
        className="min-h-[44px] resize-none border-0 bg-transparent px-3 py-2.5 text-base shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-1">
        <p className="text-[11px] text-muted-foreground">
          ⏎ — {t(profile.locale, "send")} · ⇧⏎ — new line
        </p>
        {loading ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={onStop}
            className="size-9 rounded-full"
            aria-label="Stop"
          >
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!value.trim()}
            className="size-9 rounded-full shadow-glow"
            aria-label="Send"
          >
            <ArrowUp className="size-4" />
          </Button>
        )}
      </div>
    </form>
  )
}
