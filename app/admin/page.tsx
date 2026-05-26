"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users, Crown, Zap, Gift, RefreshCw,
  Shield, BarChart2, MessageSquare, ArrowLeft
} from "lucide-react"

interface User {
  id: string
  name: string
  locale: string
  is_admin: boolean
  created_at: string
  subscription?: {
    plan: string
    status: string
    trial_ends_at: string
    current_period_end: string
  }
  usage?: {
    chat_messages_count: number
  }
}

interface Stats {
  totalUsers: number
  proUsers: number
  familyUsers: number
  freeUsers: number
  totalMessages: number
  totalTransactions: number
  totalBooks: number
}

function PlanBadge({ plan }: { plan: string }) {
  if (plan === "family") return (
    <span className="text-[10px] bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded-full font-medium">Отбасы</span>
  )
  if (plan === "pro") return (
    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Pro</span>
  )
  return (
    <span className="text-[10px] bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full font-medium">Тегін</span>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPlan, setNewPlan] = useState("pro")
  const [newDays, setNewDays] = useState("30")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [usersRes, statsRes] = await Promise.all([
      fetch("/api/admin?action=users"),
      fetch("/api/admin?action=stats"),
    ])

    if (usersRes.status === 403) {
      setForbidden(true)
      setLoading(false)
      return
    }

    const usersData = await usersRes.json()
    const statsData = await statsRes.json()

    setUsers(usersData.users ?? [])
    setStats(statsData)
    setLoading(false)
  }

  function showMsg(text: string, type: "success" | "error") {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleSetPlan(userId: string) {
    setSaving(userId)
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "setPlan",
        userId,
        plan: newPlan,
        days: Number(newDays),
      }),
    })
    const data = await res.json()
    if (data.success) {
      showMsg(`План өзгертілді: ${newPlan} (${newDays} күн)`, "success")
      setSelectedUser(null)
      loadData()
    }
    setSaving(null)
  }

  async function handleResetUsage(userId: string) {
    setSaving(userId + "reset")
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resetUsage", userId }),
    })
    const data = await res.json()
    if (data.success) {
      showMsg("Лимит тазаланды!", "success")
      loadData()
    }
    setSaving(null)
  }

  async function handleToggleAdmin(userId: string) {
    setSaving(userId + "admin")
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggleAdmin", userId }),
    })
    const data = await res.json()
    if (data.success) {
      showMsg("Admin статусы өзгертілді!", "success")
      loadData()
    }
    setSaving(null)
  }

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase())
    const matchPlan = planFilter === "all" || u.subscription?.plan === planFilter
    return matchSearch && matchPlan
  })

  if (forbidden) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="size-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold">Рұқсат жоқ</h1>
          <p className="text-muted-foreground mt-2">Бұл бет тек adminдерге арналған</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-xl bg-primary text-primary-foreground px-6 py-2 text-sm font-medium"
          >
            Басты бетке
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <Shield className="size-5 text-primary" />
        <h1 className="text-lg font-semibold">Admin панель</h1>
        <button
          onClick={loadData}
          className="ml-auto p-2 rounded-full hover:bg-muted/40 transition-colors"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm text-center ${
            message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="size-4 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Пайдаланушылар</p>
              </div>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-[10px] bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full">
                  Тегін: {stats.freeUsers}
                </span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Pro: {stats.proUsers}
                </span>
                <span className="text-[10px] bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded-full">
                  Отбасы: {stats.familyUsers}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="size-4 text-accent" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Белсенділік</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="size-3" /> Хабарламалар
                  </span>
                  <span className="font-mono font-bold">{stats.totalMessages}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Транзакциялар</span>
                  <span className="font-mono font-bold">{stats.totalTransactions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Кітап статусы</span>
                  <span className="font-mono font-bold">{stats.totalBooks}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Промо кодтар */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold mb-3">🎁 Промо кодтар</p>
          <div className="space-y-2">
            {[
              { code: "UNEMAI2025", plan: "Pro", days: 30 },
              { code: "QAZAQSTAN", plan: "Pro", days: 7 },
              { code: "FAMILY2025", plan: "Family", days: 14 },
            ].map((promo) => (
              <div key={promo.code} className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5">
                <div>
                  <p className="font-mono font-bold text-sm">{promo.code}</p>
                  <p className="text-xs text-muted-foreground">{promo.plan} · {promo.days} күн</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(promo.code)}
                  className="text-xs text-primary hover:opacity-80 transition"
                >
                  Көшіру
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Пайдаланушылар */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Пайдаланушылар ({filteredUsers.length})
            </p>
            <input
              type="text"
              placeholder="Іздеу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
            />
            <div className="flex gap-2">
              {["all", "free", "pro", "family"].map((f) => (
                <button
                  key={f}
                  onClick={() => setPlanFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    planFilter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {f === "all" ? "Бәрі" : f === "free" ? "Тегін" : f === "pro" ? "Pro" : "Отбасы"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Жүктелуде...</div>
          ) : (
            <div className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <div key={user.id}>
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold shrink-0">
                      {(user.name?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{user.name ?? "—"}</p>
                        <PlanBadge plan={user.subscription?.plan ?? "free"} />
                        {user.is_admin && (
                          <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full">Admin</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          💬 {user.usage?.chat_messages_count ?? 0} хабарлама
                        </p>
                        <p className="text-xs text-muted-foreground">
                          🌐 {user.locale ?? "kk"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                      className="text-xs text-primary hover:opacity-80 transition shrink-0"
                    >
                      {selectedUser?.id === user.id ? "Жабу" : "Басқару"}
                    </button>
                  </div>

                  {selectedUser?.id === user.id && (
                    <div className="px-4 pb-4 space-y-3 bg-muted/20 border-t border-border">
                      <p className="text-xs text-muted-foreground pt-3">Жоспар өзгерту:</p>
                      <div className="flex gap-2">
                        <select
                          value={newPlan}
                          onChange={(e) => setNewPlan(e.target.value)}
                          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                        >
                          <option value="free">Тегін</option>
                          <option value="pro">Pro</option>
                          <option value="family">Отбасы</option>
                        </select>
                        <input
                          type="number"
                          value={newDays}
                          onChange={(e) => setNewDays(e.target.value)}
                          placeholder="Күн"
                          className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                        />
                        <button
                          onClick={() => handleSetPlan(user.id)}
                          disabled={saving === user.id}
                          className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          {saving === user.id ? "..." : "Қолдану"}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResetUsage(user.id)}
                          disabled={saving === user.id + "reset"}
                          className="flex-1 rounded-xl border border-border px-3 py-2 text-xs hover:bg-muted/40 transition disabled:opacity-50"
                        >
                          {saving === user.id + "reset" ? "..." : "🔄 Лимитті тазалау"}
                        </button>
                        <button
                          onClick={() => handleToggleAdmin(user.id)}
                          disabled={saving === user.id + "admin"}
                          className="flex-1 rounded-xl border border-yellow-400/30 text-yellow-400 px-3 py-2 text-xs hover:bg-yellow-400/10 transition disabled:opacity-50"
                        >
                          {saving === user.id + "admin" ? "..." : user.is_admin ? "👑 Admin алу" : "👑 Admin ету"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
