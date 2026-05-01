"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Lock, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { StepHeader } from "./step-header"
import { StepFooter } from "./step-footer"
import type { AuthMode } from "@/lib/types"

export function AuthStep() {
  const { profile, setAuth, setStep } = useApp()
  const locale = profile.locale
  const [mode, setMode] = useState<AuthMode>("register")
  const [name, setName] = useState(profile.name ?? "")
  const [email, setEmail] = useState(profile.email ?? "")
  const [password, setPassword] = useState("")

  const valid =
    email.includes("@") &&
    password.length >= 4 &&
    (mode === "login" || name.trim().length > 0)

  function handleSubmit() {
    if (!valid) return
    setAuth({
      name: name.trim() || email.split("@")[0],
      email: email.trim(),
      mode,
    })
    setStep("language")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-md"
    >
      <StepHeader
        title={t(locale, "authTitle")}
        subtitle={t(locale, "authSub")}
      />

      <div className="mt-8 rounded-2xl border border-border bg-card/60 p-1.5 shadow-sm backdrop-blur">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1 text-sm">
          {(["register", "login"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-lg px-3 py-2 font-medium transition-all",
                mode === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(locale, m === "register" ? "register" : "login")}
            </button>
          ))}
        </div>

        <form
          className="space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                {t(locale, "name")}
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 pl-9"
                  placeholder="Aibek"
                  autoComplete="name"
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">
              {t(locale, "email")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 pl-9"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">
              {t(locale, "password")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pl-9"
                placeholder="••••••••"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={!valid}
            className="h-11 w-full rounded-full shadow-glow"
          >
            {t(locale, "continue")}
          </Button>
        </form>
      </div>

      <StepFooter
        onBack={() => setStep("theme")}
        onNext={handleSubmit}
        nextDisabled={!valid}
        locale={locale}
      />
    </motion.div>
  )
}
