"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Users, Mail, LogOut, Crown, User } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

function fmt(n: number): string {
  if (!n || n <= 0) return "0 ₸"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

export default function FamilyPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [family, setFamily] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [familyName, setFamilyName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    fetch("/api/family")
      .then((r) => r.json())
      .then((d) => {
        setFamily(d.family)
        setLoading(false)
      })
  }, [])

  async function handleCreate() {
    if (!familyName.trim()) return
    setSaving(true)
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name: familyName.trim() }),
    })
    const data = await res.json()
    if (data.family) {
      setFamily({ ...data.family, members: [], role: "admin" })
      setShowCreate(false)
      setFamilyName("")
    }
    setSaving(false)
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setSaving(true)
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invite", email: inviteEmail.trim() }),
    })
    const data = await res.json()
    if (data.success) {
      setMessage({ text: locale === "kk" ? "Шақыру жіберілді!" : locale === "ru" ? "Приглашение отправлено!" : "Invitation sent!", type: "success" })
      setInviteEmail("")
      setShowInvite(false)
    } else {
      setMessage({ text: data.error, type: "error" })
    }
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleLeave() {
    if (!confirm(locale === "kk" ? "Отбасыдан шығасыз ба?" : locale === "ru" ? "Выйти из семьи?" : "Leave family?")) return
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave" }),
    })
    setFamily(null)
  }

  const totalFamilyIncome = family?.members?.reduce((s: number, m: any) => s + m.totalIncome, 0) ?? 0
  const totalFamilyExpenses = family?.members?.reduce((s: number, m: any) => s + m.totalExpenses, 0) ?? 0
  const totalFamilySavings = family?.members?.reduce((s: number, m: any) => s + m.savings, 0) ?? 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t(locale, "loading")}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">
            {locale === "kk" ? "Отбасылық бюджет" : locale === "ru" ? "Семейный бюджет" : "Family Budget"}
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm text-center ${
            message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
          }`}>
            {message.text}
          </div>
        )}

        {!family ? (
          // Отбасы жоқ
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <Users className="size-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">
                {locale === "kk" ? "Отбасыңыз жоқ" : locale === "ru" ? "У вас нет семьи" : "No family yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {locale === "kk" ? "Жаңа отбасы жасаңыз немесе шақыруды қабылдаңыз" :
                 locale === "ru" ? "Создайте новую семью или примите приглашение" :
                 "Create a new family or accept an invitation"}
              </p>
            </div>

            {showCreate ? (
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <h3 className="font-medium">
                  {locale === "kk" ? "Жаңа отбасы" : locale === "ru" ? "Новая семья" : "New family"}
                </h3>
                <input
                  type="text"
                  placeholder={locale === "kk" ? "Отбасы атауы" : locale === "ru" ? "Название семьи" : "Family name"}
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                  >
                    {saving ? t(locale, "saving") : t(locale, "add")}
                  </button>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted/40 transition"
                  >
                    {t(locale, "cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                <Plus className="size-4" />
                {locale === "kk" ? "Отбасы жасау" : locale === "ru" ? "Создать семью" : "Create family"}
              </button>
            )}
          </div>
        ) : (
          // Отбасы бар
          <div className="space-y-4">

            {/* Отбасы аты */}
            <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center">
                  <Users className="size-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">{family.name}</p>
                  <p className="text-xs text-muted-foreground">{family.members?.length ?? 0} {locale === "kk" ? "мүше" : locale === "ru" ? "участника" : "members"}</p>
                </div>
              </div>
              <button
                onClick={handleLeave}
                className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title={locale === "kk" ? "Шығу" : locale === "ru" ? "Выйти" : "Leave"}
              >
                <LogOut className="size-4" />
              </button>
            </div>

            {/* Жалпы статистика */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t(locale, "income")}</p>
                <p className="font-mono font-bold text-sm text-primary">{fmt(totalFamilyIncome)}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t(locale, "expenses")}</p>
                <p className="font-mono font-bold text-sm">{fmt(totalFamilyExpenses)}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t(locale, "savingsWord")}</p>
                <p className="font-mono font-bold text-sm text-green-500">{fmt(totalFamilySavings)}</p>
              </div>
            </div>

            {/* Мүшелер тізімі */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {locale === "kk" ? "Мүшелер" : locale === "ru" ? "Участники" : "Members"}
                </p>
              </div>
              <div className="divide-y divide-border">
                {family.members?.map((member: any) => (
                  <div key={member.user_id} className="px-4 py-3 flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold shrink-0">
                      {(member.name?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        {member.role === "admin" && (
                          <Crown className="size-3 text-yellow-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(locale, "income")}: {fmt(member.totalIncome)} · {t(locale, "expenses")}: {fmt(member.totalExpenses)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm text-green-500">{fmt(member.savings)}</p>
                      <p className="text-[10px] text-muted-foreground">{t(locale, "savingsWord")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Мүше шақыру */}
            {family.role === "admin" && (
              showInvite ? (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <h3 className="font-medium">
                    {locale === "kk" ? "Мүше шақыру" : locale === "ru" ? "Пригласить участника" : "Invite member"}
                  </h3>
                  <input
                    type="email"
                    placeholder="Email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleInvite}
                      disabled={saving}
                      className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                    >
                      {saving ? t(locale, "saving") : locale === "kk" ? "Шақыру жіберу" : locale === "ru" ? "Отправить" : "Send invite"}
                    </button>
                    <button
                      onClick={() => setShowInvite(false)}
                      className="rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted/40 transition"
                    >
                      {t(locale, "cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowInvite(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                  <Mail className="size-4" />
                  {locale === "kk" ? "Мүше шақыру" : locale === "ru" ? "Пригласить участника" : "Invite member"}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
