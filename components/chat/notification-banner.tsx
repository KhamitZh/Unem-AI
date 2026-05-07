"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

export function NotificationBanner() {
  const { profile, goals } = useApp()
  const locale = profile.locale
  const [show, setShow] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
      if (Notification.permission === "default") {
        setShow(true)
      }
    }
  }, [])

  async function requestPermission() {
    const result = await Notification.requestPermission()
    setPermission(result)
    setShow(false)

    if (result === "granted") {
      // Тест хабарлама
      new Notification("Unem AI", {
        body: locale === "kk"
          ? "Хабарламалар қосылды! 🎉"
          : locale === "ru"
          ? "Уведомления включены! 🎉"
          : "Notifications enabled! 🎉",
        icon: "/icon-192.png",
      })

      // Мақсат тексеру
      checkGoals()
    }
  }

  function checkGoals() {
    const income = profile.estimatedIncome ?? 0
    if (!income || !goals.length) return

    goals.forEach((goal) => {
      const months = Math.ceil(goal.price / income)
      if (months <= 3) {
        setTimeout(() => {
          new Notification("Unem AI — " + (
            locale === "kk" ? "Мақсатыңыз жақын!" :
            locale === "ru" ? "Цель близко!" : "Goal is close!"
          ), {
            body: locale === "kk"
              ? `"${goal.title}" мақсатыңызға ${months} айда жетесіз! 💪`
              : locale === "ru"
              ? `До цели "${goal.title}" осталось ${months} месяца! 💪`
              : `You'll reach "${goal.title}" in ${months} months! 💪`,
            icon: "/icon-192.png",
          })
        }, 2000)
      }
    })
  }

  if (!show || permission !== "default") return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="rounded-2xl border border-border bg-card shadow-xl p-4 flex items-start gap-3">
        <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Bell className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {locale === "kk" ? "Хабарламаларды қосыңыз" :
             locale === "ru" ? "Включите уведомления" :
             "Enable notifications"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "kk" ? "Мақсатыңызға жақындағанда хабарлаймыз" :
             locale === "ru" ? "Сообщим, когда вы близки к цели" :
             "We'll notify you when you're close to your goal"}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={requestPermission}
              className="flex-1 rounded-xl bg-primary text-primary-foreground py-2 text-xs font-medium hover:opacity-90 transition"
            >
              {locale === "kk" ? "Қосу" : locale === "ru" ? "Включить" : "Enable"}
            </button>
            <button
              onClick={() => setShow(false)}
              className="rounded-xl border border-border px-3 py-2 text-xs hover:bg-muted/40 transition"
            >
              {t(locale, "cancel")}
            </button>
          </div>
        </div>
        <button onClick={() => setShow(false)} className="text-muted-foreground hover:text-foreground transition shrink-0">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
