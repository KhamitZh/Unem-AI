"use client"

import { useEffect, useRef } from "react"
import { useApp } from "@/lib/store"

export function GoalChecker() {
  const { profile, goals } = useApp()
  const checkedRef = useRef(false)

  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true

    const income = profile.estimatedIncome ?? 0
    if (!income || !goals.length) return

    // Әр мақсатты тексеру
    goals.forEach(async (goal) => {
      const months = Math.ceil(goal.price / income)

      // 3 айдан аз қалса email жіберу
      if (months <= 3 && months > 0) {
        try {
          await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "goal_near",
              goalTitle: goal.title,
              months,
            }),
          })
        } catch (e) {
          console.error("Notify error:", e)
        }

        // Push notification да жіберу
        if (Notification.permission === "granted") {
          new Notification("Unem AI", {
            body:
              profile.locale === "kk"
                ? `"${goal.title}" мақсатыңызға ${months} ай қалды! 💪`
                : profile.locale === "ru"
                ? `До цели "${goal.title}" осталось ${months} месяца! 💪`
                : `${months} months left to reach "${goal.title}"! 💪`,
            icon: "/icon-192.png",
          })
        }
      }
    })
  }, [profile, goals])

  return null
}
