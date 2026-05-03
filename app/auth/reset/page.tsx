"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function ResetPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleReset = async () => {
    if (password !== confirm) {
      setMessage({ text: "Парольдер сәйкес келмейді!", type: "error" })
      return
    }
    if (password.length < 6) {
      setMessage({ text: "Пароль кемінде 6 таңба болуы керек!", type: "error" })
      return
    }

    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage({ text: error.message, type: "error" })
    } else {
      setMessage({ text: "Пароль сәтті жаңартылды!", type: "success" })
      setTimeout(() => router.push("/"), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-2">
          Жаңа пароль
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-6">
          Жаңа паролді енгізіңіз
        </p>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="Жаңа пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground"
          />
          <input
            type="password"
            placeholder="Паролді растаңыз"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground"
          />

          {message && (
            <p className={`text-sm text-center ${message.type === "error" ? "text-destructive" : "text-green-500"}`}>
              {message.text}
            </p>
          )}

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            {loading ? "Жүктелуде..." : "Паролді жаңарту"}
          </button>
        </div>
      </div>
    </div>
  )
}
