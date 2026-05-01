"use client"

import { useEffect } from "react"
import { useApp } from "@/lib/store"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { ChatScreen } from "@/components/chat/chat-screen"
import { AIOrb } from "@/components/ai-orb"

export default function Page() {
  const { hydrated, step, profile } = useApp()

  // Apple-style splash while zustand rehydrates from localStorage
  if (!hydrated) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <AIOrb size={72} />
      </main>
    )
  }

  const onboardingDone =
    step === "done" &&
    profile.email &&
    profile.ageGroup &&
    profile.incomeBracket

  if (onboardingDone) return <ChatScreen />
  return <OnboardingFlow />
}
