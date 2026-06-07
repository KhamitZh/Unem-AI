"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Plus, MessageSquare, Trash2, Pencil, Check, X,
  ChevronLeft, ChevronRight, Settings, Pin, PinOff, Shield,
  TrendingUp, TrendingDown, Target, BarChart2, DollarSign,
  Receipt, BookOpen, Users, Trophy, Gift, Percent, LineChart,
  Building2, Sunset, Sparkles, LayoutGrid
} from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface Props {
  showMobile?: boolean
  onMobileClose?: () => void
}

export function ChatSidebar({ showMobile, onMobileClose }: Props) {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [sessions, setSessions] = useState<any[]>([])
  const [showFunctions, setShowFunctions] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    loadSessions()
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(async (data) => {
        if (data.userId) {
          const res = await fetch("/api/admin?action=stats")
          if (res.ok) setIsAdmin(true)
        }
      })
      .catch(() => {})
  }, [])

  async function loadSessions() {
    const res = await fetch("/api/sessions")
    const data = await res.json()
    setSessions(data.sessions ?? [])
  }

  async function newChat() {
    router.push("/")
    onMobileClose?.()
  }

  async function deleteSession(id: string) {
    await fetch(`/api/sessions?id=${id}`, { method: "DELETE" })
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  async function pinSession(id: string, pinned: boolean) {
    await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned: !pinned }),
    })
    loadSessions()
  }

  async function renameSession(id: string) {
    if (!editTitle.trim()) return
    await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title: editTitle.trim() }),
    })
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, title: editTitle.trim() } : s))
    setEditId(null)
  }

  const pinned = sessions.filter((s) => s.pinned)
  const unpinned = sessions.filter((s) => !s.pinned)

  return (
    <>
      {/* Mobile overlay */}
      {showMobile && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside className={cn(
        "flex flex-col border-r border-border bg-background transition-all duration-300 z-30 h-full",
        collapsed ? "w-14" : "w-64",
        "fixed md:relative inset-y-0 left-0",
        showMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Unem AI" className="size-7 rounded-lg object-cover" />
              <span className="font-bold text-sm bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Unem AI
              </span>
            </div>
          )}
          {collapsed && (
            <img src="/logo.png" alt="Unem AI" className="size-7 rounded-lg object-cover mx-auto" />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-full p-1.5 hover:bg-muted/40 transition-colors ml-auto"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        {/* New chat */}
        <div className="px-2 py-2 shrink-0">
          <button
            onClick={newChat}
            className={cn(
              "flex items-center gap-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors w-full px-3 py-2.5",
              collapsed && "justify-center"
            )}
          >
            <Plus className="size-4 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{t(locale, "newChat")}</span>}
          </button>
        </div>

        {/* Функциялар батырмасы — desktop */}
        <div className="px-2 py-1 shrink-0">
          <button
            onClick={() => setShowFunctions(!showFunctions)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2.5 w-full hover:bg-muted/40 transition-colors",
              showFunctions ? "bg-muted/40 text-foreground" : "text-muted-foreground",
              collapsed && "justify-center"
            )}
          >
            <LayoutGrid className="size-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="text-sm flex-1 text-left">
                  {locale === "kk" ? "Функциялар" : locale === "ru" ? "Функции" : "Functions"}
                </span>
                <ChevronRight className={`size-3.5 transition-transform ${showFunctions ? "rotate-90" : ""}`} />
              </>
            )}
          </button>
        </div>

        {/* Функциялар тізімі — desktop */}
        {showFunctions && !collapsed && (
          <div className="px-2 pb-2 space-y-3 border-b border-border overflow-y-auto max-h-[50vh]">
            {[
              {
                label: locale === "kk" ? "💰 Қаржы" : locale === "ru" ? "💰 Финансы" : "💰 Finance",
                items: [
                  { icon: TrendingUp, label: locale === "kk" ? "Кіріс" : locale === "ru" ? "Доходы" : "Income", href: "/finances/income", color: "text-green-500" },
                  { icon: TrendingDown, label: locale === "kk" ? "Шығыс" : locale === "ru" ? "Расходы" : "Expenses", href: "/finances/expenses", color: "text-red-400" },
                  { icon: Target, label: locale === "kk" ? "Мақсаттар" : locale === "ru" ? "Цели" : "Goals", href: "/finances/goals", color: "text-accent" },
                  { icon: Receipt, label: locale === "kk" ? "Транзакциялар" : locale === "ru" ? "Транзакции" : "Transactions", href: "/transactions", color: "text-orange-400" },
                ],
              },
              {
                label: locale === "kk" ? "📊 Талдау" : locale === "ru" ? "📊 Аналитика" : "📊 Analytics",
                items: [
                  { icon: BarChart2, label: locale === "kk" ? "Диаграммалар" : locale === "ru" ? "Диаграммы" : "Charts", href: "/analytics", color: "text-blue-400" },
                  { icon: Target, label: locale === "kk" ? "Мақсат тренер" : locale === "ru" ? "Тренер целей" : "Goal Tracker", href: "/goal-tracker", color: "text-purple-400" },
                  { icon: Sparkles, label: locale === "kk" ? "AI Жоспар" : locale === "ru" ? "AI План" : "AI Plan", href: "/financial-plan", color: "text-violet-400" },
                ],
              },
              {
                label: locale === "kk" ? "🧮 Калькуляторлар" : locale === "ru" ? "🧮 Калькуляторы" : "🧮 Calculators",
                items: [
                  { icon: Percent, label: locale === "kk" ? "Инфляция" : "Инфляция", href: "/inflation", color: "text-red-400" },
                  { icon: LineChart, label: locale === "kk" ? "Инвестиция" : locale === "ru" ? "Инвестиции" : "Investment", href: "/investment", color: "text-purple-400" },
                  { icon: Building2, label: locale === "kk" ? "Депозиттер" : locale === "ru" ? "Депозиты" : "Deposits", href: "/deposits", color: "text-green-400" },
                  { icon: Sunset, label: locale === "kk" ? "Зейнет" : locale === "ru" ? "Пенсия" : "Retirement", href: "/retirement", color: "text-orange-400" },
                  { icon: DollarSign, label: locale === "kk" ? "Валюта" : "Валюта", href: "/currency", color: "text-yellow-400" },
                ],
              },
              {
                label: locale === "kk" ? "📚 Білім" : locale === "ru" ? "📚 Обучение" : "📚 Learning",
                items: [
                  { icon: BookOpen, label: locale === "kk" ? "Кітаптар" : locale === "ru" ? "Книги" : "Books", href: "/books", color: "text-emerald-400" },
                ],
              },
              {
                label: locale === "kk" ? "👥 Әлеуметтік" : locale === "ru" ? "👥 Социальное" : "👥 Social",
                items: [
                  { icon: Users, label: locale === "kk" ? "Қоғамдастық" : locale === "ru" ? "Сообщество" : "Community", href: "/community", color: "text-cyan-400" },
                  { icon: Trophy, label: locale === "kk" ? "Лидерлер" : locale === "ru" ? "Лидеры" : "Leaderboard", href: "/leaderboard", color: "text-yellow-400" },
                  { icon: Users, label: locale === "kk" ? "Отбасы" : locale === "ru" ? "Семья" : "Family", href: "/family", color: "text-pink-400" },
                  { icon: Gift, label: locale === "kk" ? "Дос шақыру" : locale === "ru" ? "Пригласить" : "Invite", href: "/referral", color: "text-pink-400" },
                ],
              },
            ].map((group) => (
              <div key={group.label}>
                <p className="text-[10px] text-muted-foreground px-2 py-1 uppercase tracking-widest">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 w-full text-left hover:bg-muted/40 transition-colors"
                    >
                      <item.icon className={`size-3.5 shrink-0 ${item.color}`} />
                      <span className="text-xs text-foreground/80 truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
          {pinned.length > 0 && !collapsed && (
            <p className="text-[10px] text-muted-foreground px-2 py-1 uppercase tracking-widest">
              📌 {t(locale, "pinned")}
            </p>
          )}

          {[...pinned, ...unpinned].map((session) => (
            <div key={session.id} className="group relative">
              {editId === session.id ? (
                <div className="flex items-center gap-1 px-2">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && renameSession(session.id)}
                    className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                  />
                  <button onClick={() => renameSession(session.id)} className="p-1 text-green-500">
                    <Check className="size-3.5" />
                  </button>
                  <button onClick={() => setEditId(null)} className="p-1 text-muted-foreground">
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { router.push(`/?session=${session.id}`); onMobileClose?.() }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 w-full text-left hover:bg-muted/40 transition-colors",
                    collapsed && "justify-center"
                  )}
                >
                  <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                  {!collapsed && (
                    <span className="text-xs truncate flex-1 text-foreground/80">
                      {session.title || t(locale, "newChat")}
                    </span>
                  )}
                  {session.pinned && !collapsed && (
                    <Pin className="size-2.5 text-primary shrink-0" />
                  )}
                </button>
              )}

              {/* Actions */}
              {!collapsed && editId !== session.id && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-background border border-border rounded-lg px-1">
                  <button
                    onClick={() => pinSession(session.id, session.pinned)}
                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {session.pinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
                  </button>
                  <button
                    onClick={() => { setEditId(session.id); setEditTitle(session.title || "") }}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-2 py-2 border-t border-border space-y-1 shrink-0">
          {isAdmin && (
            <button
              onClick={() => { router.push("/admin"); onMobileClose?.() }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 w-full text-yellow-400 hover:bg-yellow-400/10 transition-colors",
                collapsed && "justify-center"
              )}
            >
              <Shield className="size-4 shrink-0" />
              {!collapsed && <span className="text-xs">Admin панель</span>}
            </button>
          )}
          <button
            onClick={() => { router.push("/settings"); onMobileClose?.() }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 w-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors",
              collapsed && "justify-center"
            )}
          >
            <Settings className="size-4 shrink-0" />
            {!collapsed && <span className="text-xs">{t(locale, "settings")}</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
