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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Blur background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-white/5" />
      
      <div className="relative flex items-center justify-around px-6 py-3">
        {/* Чат */}
        <button
          onClick={() => router.push("/")}
          className="flex flex-col items-center gap-1.5 relative"
        >
          <div className={cn(
            "size-10 rounded-2xl flex items-center justify-center transition-all duration-300",
            isChat 
              ? "bg-green-500 shadow-lg shadow-green-500/30" 
              : "bg-white/5 hover:bg-white/10"
          )}>
            <MessageSquare className={cn("size-5 transition-colors", isChat ? "text-white" : "text-muted-foreground")} />
          </div>
          <span className={cn("text-[10px] font-medium transition-colors", isChat ? "text-green-400" : "text-muted-foreground")}>
            {tx.chat}
          </span>
        </button>

        {/* Функциялар — орталық үлкен батырма */}
        <button
          onClick={onFunctionsClick}
          className="flex flex-col items-center gap-1.5 -mt-4 relative"
        >
          <div className="size-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-500/40 border-4 border-background">
            <img src="/logo.png" alt="Unem AI" className="size-8 rounded-xl object-cover" />
          </div>
          <span className="text-[10px] font-medium text-green-400">{tx.functions}</span>
        </button>

        {/* Профиль */}
        <button
          onClick={() => router.push("/profile")}
          className="flex flex-col items-center gap-1.5"
        >
          <div className={cn(
            "size-10 rounded-2xl flex items-center justify-center transition-all duration-300",
            isProfile 
              ? "bg-green-500 shadow-lg shadow-green-500/30" 
              : "bg-white/5 hover:bg-white/10"
          )}>
            <User className={cn("size-5 transition-colors", isProfile ? "text-white" : "text-muted-foreground")} />
          </div>
          <span className={cn("text-[10px] font-medium transition-colors", isProfile ? "text-green-400" : "text-muted-foreground")}>
            {tx.profile}
          </span>
        </button>
      </div>
    </nav>
  )
}
