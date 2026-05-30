"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Gift, Copy, Check, Users, Star, Crown } from "lucide-react"
import { useApp } from "@/lib/store"

export default function ReferralPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [refCode, setRefCode] = useState("")
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const labels = {
    kk: {
      title: "Дос шақыру",
      subtitle: "Досыңызды шақырыңыз — екеуіңіз де 7 күн Pro аласыз!",
      yourCode: "Сіздің реферал кодыңыз",
      copyLink: "Сілтемені көшіру",
      copied: "Көшірілді!",
      howItWorks: "Қалай жұмыс жасайды?",
      step1: "Досыңызға кодыңызды немесе сілтемені жіберіңіз",
      step2: "Дос тіркеліп кодты қолданады",
      step3: "Екеуіңіз де 7 күн Pro аласыз!",
      yourFriends: "Шақырылған достар",
      noFriends: "Әлі ешкімді шақырмадыңыз",
      totalReward: "Жалпы сыйлық",
      days: "күн",
      applyCode: "Реферал кодын қолдану",
      codePlaceholder: "Кодты енгізіңіз",
      apply: "Қолдану",
      status: { completed: "✅ Белсенді", pending: "⏳ Күтілуде" },
    },
    ru: {
      title: "Пригласить друга",
      subtitle: "Пригласите друга — оба получите 7 дней Pro бесплатно!",
      yourCode: "Ваш реферальный код",
      copyLink: "Копировать ссылку",
      copied: "Скопировано!",
      howItWorks: "Как это работает?",
      step1: "Отправьте другу ваш код или ссылку",
      step2: "Друг регистрируется и применяет код",
      step3: "Оба получаете 7 дней Pro бесплатно!",
      yourFriends: "Приглашённые друзья",
      noFriends: "Вы ещё никого не пригласили",
      totalReward: "Всего бонусов",
      days: "дней",
      applyCode: "Применить реферальный код",
      codePlaceholder: "Введите код",
      apply: "Применить",
      status: { completed: "✅ Активен", pending: "⏳ Ожидание" },
    },
    en: {
      title: "Invite a friend",
      subtitle: "Invite a friend — both get 7 days Pro free!",
      yourCode: "Your referral code",
      copyLink: "Copy link",
      copied: "Copied!",
      howItWorks: "How it works?",
      step1: "Send your friend your code or link",
      step2: "Friend registers and applies the code",
      step3: "Both get 7 days Pro free!",
      yourFriends: "Invited friends",
      noFriends: "You haven't invited anyone yet",
      totalReward: "Total reward",
      days: "days",
      applyCode: "Apply referral code",
      codePlaceholder: "Enter code",
      apply: "Apply",
      status: { completed: "✅ Active", pending: "⏳ Pending" },
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
  }, [])

  function copyLink() {
    if (!data?.referralLink) return
    navigator.clipboard.writeText(data.referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function applyCode() {
    if (!refCode.trim()) return
    setApplying(true)
    const res = await fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "applyReferral", code: refCode.trim() }),
    })
    const result = await res.json()
    if (result.success) {
      setMessage({
        text: locale === "kk" ? `🎉 ${result.rewardDays} күн Pro берілді!` :
              locale === "ru" ? `🎉 Начислено ${result.rewardDays} дней Pro!` :
              `🎉 ${result.rewardDays} days Pro added!`,
        type: "success",
      })
      setRefCode("")
      fetch("/api/referral").then((r) => r.json()).then(setData)
    } else {
      setMessage({ text: result.error, type: "error" })
    }
    setApplying(false)
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <Gift className="size-5 text-primary" />
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

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary to-purple-600 p-6 text-white text-center">
          <div className="size-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Gift className="size-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">{tx.title}</h2>
          <p className="text-white/80 text-sm">{tx.subtitle}</p>
        </div>

        {/* Реферал коды */}
        {!loading && data?.referralCode && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{tx.yourCode}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-center">
                <p className="font-mono font-bold text-2xl text-primary tracking-widest">
                  {data.referralCode}
                </p>
              </div>
              <button
                onClick={copyLink}
                className="rounded-xl border border-border p-3 hover:bg-muted/40 transition-colors"
              >
                {copied ? <Check className="size-5 text-green-500" /> : <Copy className="size-5" />}
              </button>
            </div>
            <button
              onClick={copyLink}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? tx.copied : tx.copyLink}
            </button>
          </div>
        )}

        {/* Қалай жұмыс жасайды */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="font-semibold text-sm">{tx.howItWorks}</p>
          <div className="space-y-3">
            {[
              { num: "1", text: tx.step1, icon: "📤" },
              { num: "2", text: tx.step2, icon: "✍️" },
              { num: "3", text: tx.step3, icon: "🎁" },
            ].map((step) => (
              <div key={step.num} className="flex items-center gap-3">
                <span className="text-2xl">{step.icon}</span>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Жалпы сыйлық */}
        {data?.totalRewardDays > 0 && (
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 flex items-center gap-4">
            <Crown className="size-8 text-yellow-400 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{tx.totalReward}</p>
              <p className="font-bold text-xl text-yellow-400">{data.totalRewardDays} {tx.days} Pro</p>
            </div>
          </div>
        )}

        {/* Достар тізімі */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {tx.yourFriends} ({data?.referrals?.length ?? 0})
            </p>
          </div>
          {!data?.referrals?.length ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">{tx.noFriends}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.referrals.map((ref: any) => (
                <div key={ref.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold shrink-0">
                    {(ref.profiles?.name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{ref.profiles?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ref.created_at).toLocaleDateString(
                        locale === "kk" ? "kk-KZ" : locale === "ru" ? "ru-RU" : "en-US"
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs">{tx.status[ref.status as keyof typeof tx.status]}</p>
                    <p className="text-xs text-primary font-mono">+{ref.reward_days} {tx.days}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Реферал кодын қолдану */}
        {!data?.referredBy && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <p className="font-semibold text-sm">{tx.applyCode}</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={tx.codePlaceholder}
                value={refCode}
                onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-mono tracking-widest"
              />
              <button
                onClick={applyCode}
                disabled={applying || !refCode.trim()}
                className="rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {applying ? "..." : tx.apply}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
