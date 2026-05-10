"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Plus, Users, Mail, LogOut,
  Crown, Target, TrendingUp, TrendingDown, Wallet
} from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

function fmt(n: number): string {
  if (!n || n <= 0) return "0 ₸"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]

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
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [goalTitle, setGoalTitle] = useState("")
  const [goalAmount, setGoalAmount] = useState("")
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null)
  const [contributeAmount, setContributeAmount] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const labels = {
    kk: {
      title: "Отбасылық бюджет",
      noFamily: "Отбасыңыз жоқ",
      noFamilyDesc: "Жаңа отбасы жасаңыз немесе шақыруды қабылдаңыз",
      create: "Отбасы жасау",
      newFamily: "Жаңа отбасы",
      familyName: "Отбасы атауы",
      members: "Мүшелер",
      invite: "Мүше шақыру",
      inviteSent: "Шақыру жіберілді!",
      leave: "Отбасыдан шығасыз ба?",
      sharedGoals: "Ортақ мақсаттар",
      addGoal: "Ортақ мақсат қосу",
      goalName: "Мақсат атауы",
      goalPrice: "Мақсат сомасы",
      contribute: "Салым қосу",
      contributed: "Салым қосылды!",
      makeAdmin: "Admin ету",
      adminLimit: "Максимум 3 admin болады!",
      totalBudget: "Жалпы бюджет",
      monthsLeft: "ай қалды",
    },
    ru: {
      title: "Семейный бюджет",
      noFamily: "У вас нет семьи",
      noFamilyDesc: "Создайте новую семью или примите приглашение",
      create: "Создать семью",
      newFamily: "Новая семья",
      familyName: "Название семьи",
      members: "Участники",
      invite: "Пригласить участника",
      inviteSent: "Приглашение отправлено!",
      leave: "Выйти из семьи?",
      sharedGoals: "Общие цели",
      addGoal: "Добавить общую цель",
      goalName: "Название цели",
      goalPrice: "Сумма цели",
      contribute: "Внести вклад",
      contributed: "Вклад добавлен!",
      makeAdmin: "Сделать администратором",
      adminLimit: "Максимум 3 администратора!",
      totalBudget: "Общий бюджет",
      monthsLeft: "месяцев осталось",
    },
    en: {
      title: "Family Budget",
      noFamily: "No family yet",
      noFamilyDesc: "Create a new family or accept an invitation",
      create: "Create family",
      newFamily: "New family",
      familyName: "Family name",
      members: "Members",
      invite: "Invite member",
      inviteSent: "Invitation sent!",
      leave: "Leave family?",
      sharedGoals: "Shared goals",
      addGoal: "Add shared goal",
      goalName: "Goal name",
      goalPrice: "Goal amount",
      contribute: "Add contribution",
      contributed: "Contribution added!",
      makeAdmin: "Make admin",
      adminLimit: "Maximum 3 admins!",
      totalBudget: "Total budget",
      monthsLeft: "months left",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  useEffect(() => {
    loadFamily()
  }, [])

  async function loadFamily() {
    const res = await fetch("/api/family")
    const data = await res.json()
    setFamily(data.family)
    setLoading(false)
  }

  function showMsg(text: string, type: "success" | "error") {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

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
      await loadFamily()
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
      showMsg(tx.inviteSent, "success")
      setInviteEmail("")
      setShowInvite(false)
    } else {
      showMsg(data.error, "error")
    }
    setSaving(false)
  }

  async function handleMakeAdmin(targetUserId: string) {
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "makeAdmin", targetUserId }),
    })
    const data = await res.json()
    if (data.success) {
      await loadFamily()
    } else if (data.error === "Max admins reached") {
      showMsg(tx.adminLimit, "error")
    }
  }

  async function handleAddGoal() {
    if (!goalTitle.trim() || !goalAmount) return
    setSaving(true)
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "createGoal",
        title: goalTitle.trim(),
        targetAmount: Number(goalAmount),
      }),
    })
    await loadFamily()
    setGoalTitle("")
    setGoalAmount("")
    setShowAddGoal(false)
    setSaving(false)
  }

  async function handleContribute() {
    if (!contributeGoalId || !contributeAmount) return
    setSaving(true)
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "contribute",
        goalId: contributeGoalId,
        amount: Number(contributeAmount),
      }),
    })
    const data = await res.json()
    if (data.success) {
      showMsg(tx.contributed, "success")
      setContributeGoalId(null)
      setContributeAmount("")
      await loadFamily()
    }
    setSaving(false)
  }

  async function handleLeave() {
    if (!confirm(tx.leave)) return
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave" }),
    })
    setFamily(null)
  }

  const totalIncome = family?.members?.reduce((s: number, m: any) => s + m.totalIncome, 0) ?? 0
  const totalExpenses = family?.members?.reduce((s: number, m: any) => s + m.totalExpenses, 0) ?? 0
  const totalSavings = family?.members?.reduce((s: number, m: any) => s + m.savings, 0) ?? 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t(locale, "loading")}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">{tx.title}</h1>
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
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <Users className="size-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">{tx.noFamily}</p>
              <p className="text-sm text-muted-foreground mt-1">{tx.noFamilyDesc}</p>
            </div>

            {showCreate ? (
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <h3 className="font-medium">{tx.newFamily}</h3>
                <input
                  type="text"
                  placeholder={tx.familyName}
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                />
                <div className="flex gap-2">
                  <button onClick={handleCreate} disabled={saving}
                    className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
                    {saving ? t(locale, "saving") : t(locale, "add")}
                  </button>
                  <button onClick={() => setShowCreate(false)}
                    className="rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted/40 transition">
                    {t(locale, "cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowCreate(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                <Plus className="size-4" />
                {tx.create}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">

            {/* Отбасы header */}
            <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center">
                  <Users className="size-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">{family.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{family.members?.length ?? 0} {tx.members.toLowerCase()}</p>
                    {family.role === "admin" && (
                      <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full font-medium">Admin</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={handleLeave}
                className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="size-4" />
              </button>
            </div>

            {/* Жалпы статистика */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{tx.totalBudget}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <TrendingUp className="size-4 text-primary mx-auto mb-1" />
                  <p className="font-mono font-bold text-sm text-primary">{fmt(totalIncome)}</p>
                  <p className="text-[10px] text-muted-foreground">{t(locale, "income")}</p>
                </div>
                <div className="text-center">
                  <TrendingDown className="size-4 text-foreground/70 mx-auto mb-1" />
                  <p className="font-mono font-bold text-sm">{fmt(totalExpenses)}</p>
                  <p className="text-[10px] text-muted-foreground">{t(locale, "expenses")}</p>
                </div>
                <div className="text-center">
                  <Wallet className="size-4 text-green-500 mx-auto mb-1" />
                  <p className="font-mono font-bold text-sm text-green-500">{fmt(totalSavings)}</p>
                  <p className="text-[10px] text-muted-foreground">{t(locale, "savingsWord")}</p>
                </div>
              </div>
            </div>

            {/* Мүшелер */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{tx.members}</p>
                {family.role === "admin" && (
                  <button onClick={() => setShowInvite(!showInvite)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80 transition">
                    <Mail className="size-3.5" />
                    {tx.invite}
                  </button>
                )}
              </div>

              {showInvite && (
                <div className="px-4 py-3 border-b border-border space-y-2">
                  <input
                    type="email"
                    placeholder="Email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleInvite} disabled={saving}
                      className="flex-1 rounded-xl bg-primary text-primary-foreground py-2 text-xs font-medium hover:opacity-90 transition disabled:opacity-50">
                      {saving ? t(locale, "saving") : tx.invite}
                    </button>
                    <button onClick={() => setShowInvite(false)}
                      className="rounded-xl border border-border px-3 py-2 text-xs hover:bg-muted/40 transition">
                      {t(locale, "cancel")}
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-border">
                {family.members?.map((member: any) => (
                  <div key={member.user_id} className="px-4 py-3 flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold shrink-0">
                      {(member.name?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        {member.role === "admin" && <Crown className="size-3 text-yellow-400 shrink-0" />}
                      </div>
                      {family.role === "admin" && (
                        <p className="text-xs text-muted-foreground">
                          ↑{fmt(member.totalIncome)} ↓{fmt(member.totalExpenses)} 💚{fmt(member.savings)}
                        </p>
                      )}
                    </div>
                    {family.role === "admin" && member.role !== "admin" && (
                      <button
                        onClick={() => handleMakeAdmin(member.user_id)}
                        className="text-[10px] bg-yellow-400/10 text-yellow-400 px-2 py-1 rounded-lg hover:bg-yellow-400/20 transition shrink-0"
                      >
                        <Crown className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ортақ мақсаттар */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{tx.sharedGoals}</p>
                <button onClick={() => setShowAddGoal(!showAddGoal)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80 transition">
                  <Plus className="size-3.5" />
                  {tx.addGoal}
                </button>
              </div>

              {showAddGoal && (
                <div className="px-4 py-3 border-b border-border space-y-2">
                  <input
                    type="text"
                    placeholder={tx.goalName}
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                  />
                  <input
                    type="number"
                    placeholder={tx.goalPrice}
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAddGoal} disabled={saving}
                      className="flex-1 rounded-xl bg-primary text-primary-foreground py-2 text-xs font-medium hover:opacity-90 transition disabled:opacity-50">
                      {saving ? t(locale, "saving") : t(locale, "add")}
                    </button>
                    <button onClick={() => setShowAddGoal(false)}
                      className="rounded-xl border border-border px-3 py-2 text-xs hover:bg-muted/40 transition">
                      {t(locale, "cancel")}
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-border">
                {family.goals?.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-6">{t(locale, "noGoals")}</p>
                )}
                {family.goals?.map((goal: any) => {
                  const totalContributed = goal.contributions?.reduce((s: number, c: any) => s + c.amount, 0) ?? 0
                  const progress = goal.target_amount > 0 ? Math.min((totalContributed / goal.target_amount) * 100, 100) : 0
                  const monthsLeft = totalSavings > 0 ? Math.ceil((goal.target_amount - totalContributed) / totalSavings) : null

                  const pieData = goal.contributions?.map((c: any, i: number) => ({
                    name: c.profiles?.name ?? "—",
                    value: c.amount,
                    color: COLORS[i % COLORS.length],
                  })) ?? []

                  return (
                    <div key={goal.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{goal.title}</p>
                          <p className="text-xs text-muted-foreground font-mono">{fmt(totalContributed)} / {fmt(goal.target_amount)}</p>
                        </div>
                        {monthsLeft && monthsLeft > 0 && (
                          <span className="text-xs text-primary shrink-0">≈ {monthsLeft} {tx.monthsLeft}</span>
                        )}
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Pie chart — кім қанша салды */}
                      {pieData.length > 0 && (
                        <div className="flex items-center gap-4">
                          <ResponsiveContainer width={100} height={100}>
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} dataKey="value" paddingAngle={2}>
                                {pieData.map((entry: any, index: number) => (
                                  <Cell key={index} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v: number) => fmt(v)} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex-1 space-y-1">
                            {pieData.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs truncate">{entry.name}</span>
                                <span className="text-xs font-mono ml-auto shrink-0">{fmt(entry.value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Салым қосу */}
                      {contributeGoalId === goal.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder={t(locale, "amountPlaceholder")}
                            value={contributeAmount}
                            onChange={(e) => setContributeAmount(e.target.value)}
                            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                          />
                          <button onClick={handleContribute} disabled={saving}
                            className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-medium hover:opacity-90 transition disabled:opacity-50">
                            {saving ? "..." : t(locale, "add")}
                          </button>
                          <button onClick={() => setContributeGoalId(null)}
                            className="rounded-xl border border-border px-3 py-2 text-xs hover:bg-muted/40 transition">
                            {t(locale, "cancel")}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setContributeGoalId(goal.id)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                        >
                          <Plus className="size-3.5" />
                          {tx.contribute}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
