"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Users, UserPlus, Check, X, TrendingUp, Trophy } from "lucide-react"
import { useApp } from "@/lib/store"

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

export default function FriendsPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [friends, setFriends] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userNumber, setUserNumber] = useState("")
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const labels = {
    kk: {
      title: "Достар",
      addFriend: "Дос қосу",
      enterID: "Достың ID нөмірін енгізіңіз",
      send: "Жіберу",
      requests: "Кіріс сұраныстар",
      noFriends: "Достар жоқ",
      noRequests: "Сұраныс жоқ",
      accept: "Қабылдау",
      decline: "Бас тарту",
      remove: "Өшіру",
      savings: "Жинақ",
      myId: "Менің ID:",
    },
    ru: {
      title: "Друзья",
      addFriend: "Добавить друга",
      enterID: "Введите ID номер друга",
      send: "Отправить",
      requests: "Входящие запросы",
      noFriends: "Нет друзей",
      noRequests: "Нет запросов",
      accept: "Принять",
      decline: "Отклонить",
      remove: "Удалить",
      savings: "Сбережения",
      myId: "Мой ID:",
    },
    en: {
      title: "Friends",
      addFriend: "Add friend",
      enterID: "Enter friend's ID number",
      send: "Send",
      requests: "Incoming requests",
      noFriends: "No friends yet",
      noRequests: "No requests",
      accept: "Accept",
      decline: "Decline",
      remove: "Remove",
      savings: "Savings",
      myId: "My ID:",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  useEffect(() => {
    loadData()
    // Өз ID алу
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.userId) {
          fetch("/api/admin?action=users")
            .catch(() => {})
        }
      })

    // Profile-дан user_number алу
    fetch("/api/finances")
      .then(() => {})
  }, [])

  useEffect(() => {
    import("@/lib/supabase").then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          supabase
            .from("profiles")
            .select("user_number")
            .eq("id", data.user.id)
            .single()
            .then(({ data: p }) => {
              if (p?.user_number) setUserNumber(String(p.user_number))
            })
        }
      })
    })
  }, [])

  async function loadData() {
    setLoading(true)
    const res = await fetch("/api/friends")
    const data = await res.json()
    setFriends(data.friends ?? [])
    setRequests(data.requests ?? [])
    setLoading(false)
  }

  const [addInput, setAddInput] = useState("")

  async function handleAdd() {
    if (!addInput.trim()) return
    setAdding(true)
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", userNumber: Number(addInput.trim()) }),
    })
    const data = await res.json()
    if (data.success) {
      setMessage({
        text: locale === "kk" ? `✅ ${data.name}-ға сұраныс жіберілді!` :
              locale === "ru" ? `✅ Запрос отправлен ${data.name}!` :
              `✅ Request sent to ${data.name}!`,
        type: "success",
      })
      setAddInput("")
    } else {
      setMessage({ text: data.error, type: "error" })
    }
    setAdding(false)
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleAccept(friendId: string) {
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", friendId }),
    })
    loadData()
  }

  async function handleRemove(friendId: string) {
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", friendId }),
    })
    loadData()
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

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm text-center ${
            message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
          }`}>
            {message.text}
          </div>
        )}

        {/* Менің ID */}
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{tx.myId}</p>
            <p className="font-mono font-bold text-2xl text-primary">#{userNumber || "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === "kk" ? "Осы ID-ды достарыңызға жіберіңіз" :
               locale === "ru" ? "Отправьте этот ID друзьям" :
               "Share this ID with friends"}
            </p>
          </div>
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="size-7 text-primary" />
          </div>
        </div>

        {/* Дос қосу */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="font-semibold text-sm flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            {tx.addFriend}
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder={tx.enterID}
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-mono"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !addInput.trim()}
              className="rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {adding ? "..." : tx.send}
            </button>
          </div>
        </div>

        {/* Кіріс сұраныстар */}
        {requests.length > 0 && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-primary/10">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest">
                🔔 {tx.requests} ({requests.length})
              </p>
            </div>
            <div className="divide-y divide-border">
              {requests.map((req) => (
                <div key={req.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">
                    {(req.profiles?.name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{req.profiles?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono">#{req.profiles?.user_number}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAccept(req.user_id)}
                      className="size-9 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500/20 transition"
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(req.user_id)}
                      className="size-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Достар тізімі */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {tx.title} ({friends.length})
            </p>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {locale === "kk" ? "Жүктелуде..." : locale === "ru" ? "Загрузка..." : "Loading..."}
            </div>
          ) : friends.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="size-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{tx.noFriends}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {friends.map((friend) => (
                <div key={friend.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold overflow-hidden">
                    {friend.profiles?.avatar_url ? (
                      <img src={friend.profiles.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                      (friend.profiles?.name?.[0] ?? "?").toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{friend.profiles?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono">#{friend.profiles?.user_number}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(friend.friend_id)}
                    className="text-xs text-destructive hover:opacity-80 transition shrink-0"
                  >
                    {tx.remove}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
