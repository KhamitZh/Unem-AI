"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Lock, LogOut, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useApp()
  const locale = profile.locale
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNameForm, setShowNameForm] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setName(data.user?.user_metadata?.name ?? "")
    })
  }, [])

  async function handleUpdateName() {
    if (!name.trim()) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } })
    if (!error) {
      await supabase.from("profiles").update({ name: name.trim() }).eq("id", user.id)
      setMessage({ text: t(locale, "nameSaved"), type: "success" })
      setShowNameForm(false)
    } else {
      setMessage({ text: error.message, type: "error" })
    }
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleUpdatePassword() {
    if (newPassword !== confirmPassword) {
      setMessage({ text: t(locale, "passwordMismatch"), type: "error" })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ text: t(locale, "passwordShort"), type: "error" })
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) {
      setMessage({ text: t(locale, "passwordSaved"), type: "success" })
      setShowPasswordForm(false)
      setNewPassword("")
      setConfirmPassword("")
    } else {
      setMessage({ text: error.message, type: "error" })
    }
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/auth")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold">{t(locale, "settings")}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm text-center ${
            message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
          }`}>
            {message.text}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t(locale, "profileTitle")}</p>
          </div>
          <div className="px-4 py-4 flex items-center gap-4">
            <div className="size-14 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xl font-bold">
              {(name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{name || "—"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t(locale, "accountSection")}</p>
          </div>

          <button
            onClick={() => { setShowNameForm(!showNameForm); setShowPasswordForm(false) }}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <User className="size-4 text-muted-foreground" />
              <span className="text-sm">{t(locale, "changeName")}</span>
            </div>
            <ChevronRight className={`size-4 text-muted-foreground transition-transform ${showNameForm ? "rotate-90" : ""}`} />
          </button>

          {showNameForm && (
            <div className="px-4 pb-4 space-y-3 border-t border-border">
              <input
                type="text"
                placeholder={t(locale, "newNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-3 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={handleUpdateName}
                disabled={saving}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? t(locale, "saving") : t(locale, "save")}
              </button>
            </div>
          )}

          <div className="border-t border-border" />

          <button
            onClick={() => { setShowPasswordForm(!showPasswordForm); setShowNameForm(false) }}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lock className="size-4 text-muted-foreground" />
              <span className="text-sm">{t(locale, "changePassword")}</span>
            </div>
            <ChevronRight className={`size-4 text-muted-foreground transition-transform ${showPasswordForm ? "rotate-90" : ""}`} />
          </button>

          {showPasswordForm && (
            <div className="px-4 pb-4 space-y-3 border-t border-border">
              <input
                type="password"
                placeholder={t(locale, "newPasswordPlaceholder")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full mt-3 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              />
              <input
                type="password"
                placeholder={t(locale, "confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={handleUpdatePassword}
                disabled={saving}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? t(locale, "saving") : t(locale, "save")}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="size-4" />
            <span className="text-sm font-medium">{t(locale, "logout")}</span>
          </button>
        </div>

      </div>
    </div>
  )
}