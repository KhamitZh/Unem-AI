"use client"

import { useRouter, usePathname } from "next/navigation"
import {
  MessageSquare, TrendingUp, TrendingDown,
  Target, BarChart2, DollarSign, Settings, Users, Receipt, BookOpen
} from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { profile } = useApp()
  const locale = profile.locale

  const links = [
    { icon: MessageSquare, label: t(locale, "newChat"), href: "/" },
    { icon: TrendingUp, label: t(locale, "income"), href: "/finances/income" },
    { icon: TrendingDown, label: t(locale, "expenses"), href: "/finances/expenses" },
    { icon: Target, label: t(locale, "goals"), href: "/finances/goals" },
    { icon: BarChart2, label: t(locale, "analytics"), href: "/analytics" },
    { icon: DollarSign, label: t(locale, "currency"), href: "/currency" },
    { icon: Users, label: locale === "kk" ? "Отбасы" : locale === "ru" ? "Семья" : "Family", href: "/family" },
    { icon: Receipt, label: t(locale, "transactions"), href: "/transactions" },
    { icon: BookOpen, label: t(locale, "books"), href: "/books" },
    { icon: Settings, label: t(locale, "settings"), href: "/settings" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/90 backdrop-blur">
      <div className="flex items-center justify-around px-2 py-2 overflow-x-auto">
        {links.map(({ icon: Icon, label, href }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[52px]",
              pathname === href
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-5" />
            <span className="text-[9px] font-medium truncate max-w-[48px] text-center leading-tight">
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
