"use client"

import { useEffect, useState } from "react"

export interface SubscriptionData {
  plan: "free" | "pro" | "family"
  isTrial: boolean
  trialDaysLeft: number
  limits: {
    chatMessages: number
    finances: number
    goals: number
    books: number
    family: boolean
    csv: boolean
    analytics: boolean
    monthlyReport: boolean
  }
  usage: {
    chat_messages_count: number
  }
}

export function useSubscription() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function incrementChat() {
    await fetch("/api/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "incrementChat" }),
    })
    if (data) {
      setData((prev) => prev ? {
        ...prev,
        usage: {
          ...prev.usage,
          chat_messages_count: prev.usage.chat_messages_count + 1,
        },
      } : null)
    }
  }

  function canChat(): boolean {
    if (!data) return false
    if (data.limits.chatMessages === Infinity) return true
    return data.usage.chat_messages_count < data.limits.chatMessages
  }

  function canAddFinance(currentCount: number): boolean {
    if (!data) return false
    if (data.limits.finances === Infinity) return true
    return currentCount < data.limits.finances
  }

  function canAddGoal(currentCount: number): boolean {
    if (!data) return false
    if (data.limits.goals === Infinity) return true
    return currentCount < data.limits.goals
  }

  function chatMessagesLeft(): number {
    if (!data) return 0
    if (data.limits.chatMessages === Infinity) return Infinity
    return Math.max(0, data.limits.chatMessages - data.usage.chat_messages_count)
  }

  return {
    data,
    loading,
    incrementChat,
    canChat,
    canAddFinance,
    canAddGoal,
    chatMessagesLeft,
    isPro: data?.plan === "pro" || data?.plan === "family",
    isFamily: data?.plan === "family",
    isTrial: data?.isTrial ?? false,
  }
}
