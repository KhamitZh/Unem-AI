"use client"

import { Plus, Globe, Moon, Sun, RotateCcw, MessageSquare } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AIWordmark } from "@/components/ai-orb"
import { ProfileCard } from "./profile-card"
import { useApp } from "@/lib/store"
import { LOCALE_LABEL, t } from "@/lib/i18n"
import type { Locale } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  onNewChat: () => void
  sessions: { id: string; title: string; updated_at: string }[]
  currentSessionId: string | null
  onSelectSession: (id: string) => void
}

export function ChatSidebar({
  onNewChat,
  sessions,
  currentSessionId,
  onSelectSession,
}: Props) {
  const { profile, setLocale, reset } = useApp()
  const { theme, setTheme } = useTheme()
  const locale = profile.locale

  return (
    <aside className="hidden w-[300px] shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar/50 p-4 backdrop-blur md:flex">
      <AIWordmark />

      <Button
        onClick={onNewChat}
        className="h-10 w-full justify-start rounded-xl bg-primary/10 text-foreground hover:bg-primary/20"
        variant="ghost"
      >
        <Plus className="mr-2 size-4 text-primary" />
        {t(locale, "newChat")}
      </Button>

      {/* Чаттар тізімі */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {sessions.length > 0 && (
          <p className="px-2 text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
            Чаттар тарихы
          </p>
        )}
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors hover:bg-muted/40",
              currentSessionId === session.id && "bg-primary/10 text-primary"
            )}
          >
            <MessageSquare className="size-3.5 shrink-0 opacity-60" />
            <span className="truncate">{session.title}</span>
          </button>
        ))}
      </div>

      <ProfileCard />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 justify-start gap-2 rounded-xl border-sidebar-border bg-background/40"
              >
                <Globe className="size-3.5" />
                <span className="truncate">{LOCALE_LABEL[locale]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(Object.keys(LOCALE_LABEL) as Locale[]).map((l) => (
                <DropdownMenuItem
                  key={l}
                  onClick={() => setLocale(l)}
                  className={cn(locale === l && "bg-accent/40")}
                >
                  {LOCALE_LABEL[l]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="size-9 rounded-xl border-sidebar-border bg-background/40 p-0"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm(t(locale, "resetConfirm"))) reset()
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          {t(locale, "resetAll")}
        </button>
      </div>
    </aside>
  )
}