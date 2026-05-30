"use client"

import { useRouter, usePathname } from "next/navigation"
import { MessageSquare, LayoutGrid, User } from "lucide-react"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

export function BottomNav({ onFunctionsClick }: { onFunctionsClick?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { profile } = useApp()
  const locale = profile.locale

  const labels = {
    kk: { chat: "Чат", functions: "Функциялар", profile: "Профиль" },
    ru: { chat: "Чат", functions: "Функции", profile: "Профиль" },
    en: { chat: "Chat", functions: "Functions", profile: "Profile" },
  }
  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  const isChat = pathname === "/"
  const isProfile = pathname === "/profile" || pathname === "/settings"

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur">
      <div className="flex items-center justify-around px-2 py-2">
        {/* Чат */}
        <button
          onClick={() => router.push("/")}
          className={cn(
            "flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors",
            isChat ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="size-5" />
          <span className="text-[10px] font-medium">{tx.chat}</span>
        </button>

        {/* Функциялар */}
        <button
          onClick={onFunctionsClick}
          className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
        >
          <LayoutGrid className="size-5" />
          <span className="text-[10px] font-medium">{tx.functions}</span>
        </button>

        {/* Профиль */}
        <button
          onClick={() => router.push("/profile")}
          className={cn(
            "flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors",
            isProfile ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="size-5" />
          <span className="text-[10px] font-medium">{tx.profile}</span>
        </button>
      </div>
    </nav>
  )
}
