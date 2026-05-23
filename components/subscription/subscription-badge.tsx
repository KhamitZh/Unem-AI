"use client"

import { Crown, Zap, Gift } from "lucide-react"
import { useSubscription } from "@/lib/use-subscription"
import { useApp } from "@/lib/store"

export function SubscriptionBadge({ onClick }: { onClick?: () => void }) {
  const { data, loading, chatMessagesLeft } = useSubscription()
  const { profile } = useApp()
  const locale = profile.locale

  if (loading || !data) return null

  const isPro = data.plan === "pro" || data.plan === "family"
  const isFamily = data.plan === "family"
  const isTrial = data.isTrial

  if (isFamily) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-xs font-medium text-pink-400 hover:bg-pink-500/20 transition"
      >
        <Crown className="size-3" />
        {locale === "kk" ? "Отбасы" : locale === "ru" ? "Семья" : "Family"}
      </button>
    )
  }

  if (isPro) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition"
      >
        <Zap className="size-3" />
        {isTrial ? (
          `Pro Trial · ${data.trialDaysLeft}${locale === "kk" ? " күн" : locale === "ru" ? " дн" : "d"}`
        ) : "Pro"}
      </button>
    )
  }

  // Free plan
  const left = chatMessagesLeft()
  const isLow = left <= 5

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
        isLow
          ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
          : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/60"
      }`}
    >
      <Gift className="size-3" />
      {locale === "kk" ? `${left}/20 хабарлама` :
       locale === "ru" ? `${left}/20 сообщений` :
       `${left}/20 messages`}
    </button>
  )
}
