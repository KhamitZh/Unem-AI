"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, MessageSquare, Trash2, Pencil, Check, X,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Target, Settings, Pin, PinOff, BarChart2, DollarSign
} from "lucide-react"
import { AIWordmark } from "@/components/ai-orb"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"


interface Session {
  id: string
  title: string
  updated_at: string
  pinned?: boolean
}

interface Props {
  onNewChat: () => void
  sessions: Session[]
  currentSessionId: string | null
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, title: string) => void
  onPinSession: (id: string, pinned: boolean) => void
}

export function ChatSidebar({
  onNewChat,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onPinSession,
}: Props) {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [collapsed, setCollapsed] = useState(false)

  const pinnedSessions = sessions.filter((s) => s.pinned)
  const unpinnedSessions = sessions.filter((s) => !s.pinned)

  function startEdit(session: Session) {
    setEditingId(session.id)
    setEditingTitle(session.title)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingTitle("")
  }

  async function saveEdit(id: string) {
    if (!editingTitle.trim()) return
    await onRenameSession(id, editingTitle.trim())
    setEditingId(null)
  }

  function SessionItem({ session }: { session: Session }) {
    return (
      <div
        className={cn(
          "group relative flex items-center rounded-xl transition-colors hover:bg-muted/40",
          currentSessionId === session.id && "bg-primary/10"
        )}
      >
        {editingId === session.id ? (
          <div className="flex flex-1 items-center gap-1 px-2 py-1">
            <input
              autoFocus
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit(session.id)
                if (e.key === "Escape") cancelEdit()
              }}
              className="flex-1 rounded-lg bg-background px-2 py-1 text-sm outline-none border border-border"
            />
            <button onClick={() => saveEdit(session.id)} className="p-1 text-green-500">
              <Check className="size-3.5" />
            </button>
            <button onClick={cancelEdit} className="p-1 text-muted-foreground">
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => onSelectSession(session.id)}
              className="flex flex-1 items-center gap-2 px-3 py-2 text-sm text-left min-w-0"
            >
              {session.pinned
                ? <Pin className="size-3 text-primary shrink-0" />
                : <MessageSquare className={cn("size-3.5 shrink-0 opacity-60", currentSessionId === session.id && "text-primary opacity-100")} />
              }
              <span className="truncate">{session.title}</span>
            </button>
            <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
              <button
                onClick={() => onPinSession(session.id, !session.pinned)}
                className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                title={session.pinned ? t(locale, "pinned") : t(locale, "pinned")}
              >
                {session.pinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
              </button>
              <button
                onClick={() => startEdit(session)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
              >
                <Pencil className="size-3" />
              </button>
              <button
                onClick={() => onDeleteSession(session.id)}
                className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  const financeLinks = [
  { icon: TrendingUp, key: "income" as const, href: "/finances/income", color: "text-primary" },
  { icon: TrendingDown, key: "expenses" as const, href: "/finances/expenses", color: "text-foreground/70" },
  { icon: Target, key: "goals" as const, href: "/finances/goals", color: "text-accent" },
  { icon: BarChart2, key: "analytics" as const, href: "/analytics", color: "text-blue-400" },
  { icon: DollarSign, key: "currency" as const, href: "/currency", color: "text-yellow-400" },
  ]

  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar/50 backdrop-blur transition-all duration-300 relative",
        collapsed ? "w-[60px]" : "w-[280px]"
      )}
    >
      {/* Collapse батырмасы */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-md hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>

      <div className="flex flex-col h-full overflow-hidden">

        {/* 1. Жоғарғы бөлік — Logo + Avatar */}
        <div className={cn("flex items-center gap-2 p-4 border-b border-sidebar-border", collapsed && "justify-center")}>
          {collapsed ? (
            <button
              onClick={() => router.push("/profile")}
              className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold hover:bg-primary/25 transition-colors"
            >
              {(profile.name?.[0] ?? "?").toUpperCase()}
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push("/profile")}
                className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold hover:bg-primary/25 transition-colors shrink-0"
              >
                {(profile.name?.[0] ?? "?").toUpperCase()}
              </button>
              <AIWordmark />
            </>
          )}
        </div>

        {/* 2. Жаңа чат батырмасы */}
        <div className={cn("p-3 border-b border-sidebar-border", collapsed && "flex justify-center")}>
          {collapsed ? (
            <button
              onClick={onNewChat}
              className="size-9 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <Plus className="size-4 text-primary" />
            </button>
          ) : (
            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-2 h-9 px-3 rounded-xl bg-primary/10 text-foreground hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <Plus className="size-4 text-primary" />
              {t(locale, "newChat")}
            </button>
          )}
        </div>

        {/* 3. Чат тарихы */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
            {pinnedSessions.length > 0 && (
              <div className="space-y-0.5">
                <p className="px-2 text-[10px] uppercase tracking-widest text-muted-foreground py-1">
                  {t(locale, "pinned")}
                </p>
                {pinnedSessions.map((s) => <SessionItem key={s.id} session={s} />)}
              </div>
            )}

            {unpinnedSessions.length > 0 && (
              <div className="space-y-0.5">
                {pinnedSessions.length > 0 && (
                  <p className="px-2 text-[10px] uppercase tracking-widest text-muted-foreground py-1">
                    {t(locale, "allChats")}
                  </p>
                )}
                {unpinnedSessions.map((s) => <SessionItem key={s.id} session={s} />)}
              </div>
            )}

            {sessions.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">
                {t(locale, "noChats")}
              </p>
            )}
          </div>
        )}

        {/* Collapsed чат иконкалары */}
        {collapsed && (
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 items-center py-2 min-h-0">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                title={s.title}
                className={cn(
                  "size-9 rounded-xl flex items-center justify-center transition-colors hover:bg-muted/40",
                  currentSessionId === s.id && "bg-primary/10 text-primary",
                  s.pinned && "text-primary"
                )}
              >
                {s.pinned ? <Pin className="size-3.5" /> : <MessageSquare className="size-3.5" />}
              </button>
            ))}
          </div>
        )}

        {/* 4. Қаржы батырмалары */}
        <div className={cn("border-t border-sidebar-border p-2 space-y-1", collapsed && "flex flex-col items-center")}>
          {!collapsed && (
            <p className="px-2 text-[10px] uppercase tracking-widest text-muted-foreground py-1">
              {t(locale, "finance")}
            </p>
          )}
          {financeLinks.map(({ icon: Icon, key, href, color }) =>
            collapsed ? (
              <button
                key={href}
                onClick={() => router.push(href)}
                title={t(locale, key)}
                className="size-9 rounded-xl flex items-center justify-center hover:bg-muted/40 transition-colors"
              >
                <Icon className={cn("size-4", color)} />
              </button>
            ) : (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-muted/40 transition-colors"
              >
                <Icon className={cn("size-4", color)} />
                <span>{t(locale, key)}</span>
              </button>
            )
          )}
        </div>

        {/* 5. Астыңғы бөлік — Settings */}
        <div className={cn("border-t border-sidebar-border p-2", collapsed && "flex justify-center")}>
          {collapsed ? (
            <button
              onClick={() => router.push("/settings")}
              className="size-9 rounded-xl flex items-center justify-center hover:bg-muted/40 transition-colors"
            >
              <Settings className="size-4 text-muted-foreground" />
            </button>
          ) : (
            <button
              onClick={() => router.push("/settings")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors"
            >
              <div className="size-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                {(profile.name?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium truncate">{profile.name ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground truncate">{t(locale, "settings")}</p>
              </div>
              <Settings className="size-4 text-muted-foreground ml-auto shrink-0" />
            </button>
          )}
        </div>

      </div>
    </aside>
  )
}
