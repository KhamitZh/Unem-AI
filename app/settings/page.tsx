"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Lock, LogOut, ChevronRight, Sun, Moon, Globe } from "lucide-react"
import { useTheme } from "next-themes"
import { LOCALE_LABEL } from "@/lib/i18n"
import type { Locale } from "@/lib/types"
import { createClient } from "@/lib/supabase"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"
import { useSubscription } from "@/lib/use-subscription"
import { UpgradeModal } from "@/components/subscription/upgrade-modal"
import { Crown, Zap, Gift } from "lucide-react"

export default function SettingsPage() {
  const { data: subData, loading: subLoading } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)
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
  const [memories, setMemories] = useState<any[]>([])
  const [showMemories, setShowMemories] = useState(false)
  const [loadingMemories, setLoadingMemories] = useState(false)

  async function loadMemories() {
    setLoadingMemories(true)
    const res = await fetch("/api/memories")
    const data = await res.json()
    setMemories(data.memories ?? [])
    setLoadingMemories(false)
  }

  async function deleteMemory(key: string) {
    await fetch(`/api/memories?key=${key}`, { method: "DELETE" })
    setMemories((prev) => prev.filter((m) => m.key !== key))
  }

  async function clearAllMemories() {
    if (!confirm(locale === "kk" ? "Барлық жадыны өшіресіз бе?" : locale === "ru" ? "Удалить всю память?" : "Clear all memories?")) return
    await fetch("/api/memories", { method: "DELETE" })
    setMemories([])
  }
  const { theme, setTheme } = useTheme()
  const { setLocale } = useApp()

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

        {/* Тіл таңдау */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {locale === "kk" ? "Тіл" : locale === "ru" ? "Язык" : "Language"}
            </p>
          </div>
          <div className="flex divide-x divide-border">
            {(["kk", "ru", "en"] as Locale[]).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  locale === l
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {LOCALE_LABEL[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Тема таңдау */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {locale === "kk" ? "Тема" : locale === "ru" ? "Тема" : "Theme"}
            </p>
          </div>
          <div className="flex divide-x divide-border">
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                theme === "dark"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <Moon className="size-4" />
              {locale === "kk" ? "Қараңғы" : locale === "ru" ? "Тёмная" : "Dark"}
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                theme === "system"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <Globe className="size-4" />
              {locale === "kk" ? "Жүйе" : locale === "ru" ? "Системная" : "System"}
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                theme === "light"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <Sun className="size-4" />
              {locale === "kk" ? "Ашық" : locale === "ru" ? "Светлая" : "Light"}
            </button>
          </div>
        </div>

        {/* Subscription */}
        {!subLoading && subData && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {locale === "kk" ? "Жоспар" : locale === "ru" ? "Тариф" : "Plan"}
              </p>
            </div>
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-full flex items-center justify-center ${
                  subData.plan === "family" ? "bg-pink-500/15" :
                  subData.plan === "pro" ? "bg-primary/15" : "bg-muted/50"
                }`}>
                  {subData.plan === "family" ? <Crown className="size-5 text-pink-400" /> :
                  subData.plan === "pro" ? <Zap className="size-5 text-primary" /> :
                  <Gift className="size-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-medium">
                    {subData.plan === "family" ? (locale === "kk" ? "Отбасы" : locale === "ru" ? "Семья" : "Family") :
                    subData.plan === "pro" ? "Pro" :
                    (locale === "kk" ? "Тегін" : locale === "ru" ? "Бесплатный" : "Free")}
                  </p>
                  {subData.isTrial && (
                    <p className="text-xs text-primary">
                      {locale === "kk" ? `Trial · ${subData.trialDaysLeft} күн қалды` :
                      locale === "ru" ? `Trial · Осталось ${subData.trialDaysLeft} дней` :
                      `Trial · ${subData.trialDaysLeft} days left`}
                    </p>
                  )}
                  {subData.plan === "free" && (
                    <p className="text-xs text-muted-foreground">
                      {locale === "kk" ? `${subData.usage.chat_messages_count}/20 хабарлама` :
                      locale === "ru" ? `${subData.usage.chat_messages_count}/20 сообщений` :
                      `${subData.usage.chat_messages_count}/20 messages`}
                    </p>
                  )}
                </div>
              </div>
              {subData.plan === "free" && (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                >
                  {locale === "kk" ? "Pro алу" : locale === "ru" ? "Получить Pro" : "Get Pro"}
                </button>
              )}
            </div>
          </div>
        )}

        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

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
          {/* AI Жады */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => { setShowMemories(!showMemories); if (!showMemories) loadMemories() }}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🧠</span>
                <span className="text-sm">
                  {locale === "kk" ? "AI Жады" : locale === "ru" ? "Память AI" : "AI Memory"}
                </span>
              </div>
              <ChevronRight className={`size-4 text-muted-foreground transition-transform ${showMemories ? "rotate-90" : ""}`} />
            </button>

            {showMemories && (
              <div className="border-t border-border">
                {loadingMemories ? (
                  <p className="text-center text-xs text-muted-foreground py-4">
                    {locale === "kk" ? "Жүктелуде..." : locale === "ru" ? "Загрузка..." : "Loading..."}
                  </p>
                ) : memories.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">
                    {locale === "kk" ? "Жады бос" : locale === "ru" ? "Память пуста" : "Memory is empty"}
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {memories.map((memory) => (
                      <div key={memory.key} className="px-4 py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-primary">{memory.key}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{memory.value}</p>
                        </div>
                        <button
                          onClick={() => deleteMemory(memory.key)}
                          className="shrink-0 text-xs text-destructive hover:opacity-80 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div className="px-4 py-3">
                      <button
                        onClick={clearAllMemories}
                        className="w-full rounded-xl border border-destructive/30 text-destructive py-2 text-xs hover:bg-destructive/10 transition"
                      >
                        {locale === "kk" ? "Барлық жадыны өшіру" : locale === "ru" ? "Очистить всю память" : "Clear all memory"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
            <LogOut className="size-4" />
            <span className="text-sm font-medium">{t(locale, "logout")}</span>
          </button>
        </div>

      </div>
    </div>
  )
}