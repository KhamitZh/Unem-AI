"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [loginField, setLoginField] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async () => {
    setLoading(true)
    setMessage(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
      },
    })

    if (error) {
      setMessage({ text: error.message, type: "error" })
    } else {
      await supabase.from("profiles").upsert({
        id: data.user?.id,
        name,
        locale: "ru",
      })
      setMessage({ text: "Email жіберілді — растаңыз!", type: "success" })
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: loginField,
      password,
    })

    if (error) {
      setMessage({ text: "Email немесе пароль қате", type: "error" })
    } else {
      router.push("/")
    }
    setLoading(false)
  }

  const handleForgot = async () => {
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(loginField, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })

    if (error) {
      setMessage({ text: error.message, type: "error" })
    } else {
      setMessage({ text: "Паролді қалпына келтіру сілтемесі жіберілді!", type: "success" })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-xl">

        {/* Тақырып */}
        <h1 className="text-2xl font-bold text-center mb-2">
          {mode === "login" ? "Кіру" : mode === "register" ? "Тіркелу" : "Паролді ұмыттым"}
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-6">
          {mode === "login" ? "Unem AI-ға қош келдіңіз" : mode === "register" ? "Жаңа аккаунт жасау" : "Email енгізіңіз"}
        </p>

        <div className="space-y-4">

          {/* Тіркелу формасы */}
          {mode === "register" && (
            <>
              <input
                type="text"
                placeholder="Аты-жөніңіз"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="tel"
                placeholder="Телефон нөмірі (+7...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="password"
                placeholder="Пароль (кемінде 6 таңба)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground"
              />
            </>
          )}

          {/* Кіру формасы */}
          {mode === "login" && (
            <>
              <input
                type="text"
                placeholder="Email"
                value={loginField}
                onChange={(e) => setLoginField(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground"
              />
            </>
          )}

          {/* Паролді ұмыттым */}
          {mode === "forgot" && (
            <input
              type="email"
              placeholder="Email"
              value={loginField}
              onChange={(e) => setLoginField(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground"
            />
          )}

          {/* Хабарлама */}
          {message && (
            <p className={`text-sm text-center ${message.type === "error" ? "text-destructive" : "text-green-500"}`}>
              {message.text}
            </p>
          )}

          {/* Негізгі батырма */}
          <button
            onClick={mode === "login" ? handleLogin : mode === "register" ? handleRegister : handleForgot}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            {loading ? "Жүктелуде..." : mode === "login" ? "Кіру" : mode === "register" ? "Тіркелу" : "Жіберу"}
          </button>

          {/* Қосымша сілтемелер */}
          {mode === "login" && (
            <>
              <button
                onClick={() => setMode("forgot")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition"
              >
                Паролді ұмыттым
              </button>
              <button
                onClick={() => setMode("register")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition"
              >
                Аккаунт жоқ па? Тіркелу
              </button>
            </>
          )}

          {(mode === "register" || mode === "forgot") && (
            <button
              onClick={() => setMode("login")}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition"
            >
              ← Кіруге оралу
            </button>
          )}

        </div>
      </div>
    </div>
  )
}
