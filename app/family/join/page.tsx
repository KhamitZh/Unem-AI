"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Users, Check, X } from "lucide-react"
import { useApp } from "@/lib/store"

export default function JoinFamilyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { profile } = useApp()
  const locale = profile.locale
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage(locale === "kk" ? "Токен жоқ" : locale === "ru" ? "Токен отсутствует" : "No token")
      return
    }

    fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success")
          setMessage(
            locale === "kk" ? "Отбасыға сәтті қосылдыңыз!" :
            locale === "ru" ? "Вы успешно присоединились к семье!" :
            "Successfully joined the family!"
          )
          setTimeout(() => router.push("/family"), 2000)
        } else {
          setStatus("error")
          setMessage(data.error ?? "Error")
        }
      })
      .catch(() => {
        setStatus("error")
        setMessage(locale === "kk" ? "Қате шықты" : locale === "ru" ? "Произошла ошибка" : "An error occurred")
      })
  }, [token])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <div className="size-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
          {status === "loading" && <Users className="size-8 text-primary animate-pulse" />}
          {status === "success" && <Check className="size-8 text-green-500" />}
          {status === "error" && <X className="size-8 text-destructive" />}
        </div>

        <h1 className="text-xl font-bold mb-2">
          {status === "loading" && (locale === "kk" ? "Қосылуда..." : locale === "ru" ? "Присоединяемся..." : "Joining...")}
          {status === "success" && (locale === "kk" ? "Сәтті!" : locale === "ru" ? "Успешно!" : "Success!")}
          {status === "error" && (locale === "kk" ? "Қате!" : locale === "ru" ? "Ошибка!" : "Error!")}
        </h1>

        <p className="text-sm text-muted-foreground">{message}</p>

        {status !== "loading" && (
          <button
            onClick={() => router.push("/family")}
            className="mt-6 w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition"
          >
            {locale === "kk" ? "Отбасы бетіне өту" : locale === "ru" ? "Перейти к семье" : "Go to family"}
          </button>
        )}
      </div>
    </div>
  )
}
