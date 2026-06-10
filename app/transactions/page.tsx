"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, MessageSquare, Trash2, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔", transport: "🚗", entertainment: "🎬",
  shopping: "🛍️", health: "💊", salary: "💼",
  transfer: "💸", other: "📦",
}

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  food: { kk: "Тамақ", ru: "Еда", en: "Food" },
  transport: { kk: "Көлік", ru: "Транспорт", en: "Transport" },
  entertainment: { kk: "Ойын-сауық", ru: "Развлечения", en: "Entertainment" },
  shopping: { kk: "Сауда", ru: "Покупки", en: "Shopping" },
  health: { kk: "Денсаулық", ru: "Здоровье", en: "Health" },
  salary: { kk: "Жалақы", ru: "Зарплата", en: "Salary" },
  transfer: { kk: "Аударым", ru: "Перевод", en: "Transfer" },
  other: { kk: "Басқа", ru: "Другое", en: "Other" },
}

function fmt(n: number): string {
  if (!n || n <= 0) return "0 ₸"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

export default function TransactionsPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const fileRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [parsing, setParsing] = useState(false)
  const [smsText, setSmsText] = useState("")
  const [showSms, setShowSms] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const labels = {
    kk: {
      title: "Транзакциялар",
      uploadCSV: "CSV жүктеу (Kaspi/Halyk)",
      parseSMS: "SMS парсинг",
      smsPlaceholder: "Банк SMS-ін қойыңыз...",
      parse: "Оқу",
      save: "Сақтау",
      cancel: "Болдырмау",
      preview: "Алдын ала қарау",
      income: "Кіріс",
      expense: "Шығыс",
      noTransactions: "Транзакция жоқ",
      saved: "Сақталды!",
      parseError: "Оқу қатесі",
      total: "Жалпы",
    },
    ru: {
      title: "Транзакции",
      uploadCSV: "Загрузить CSV (Kaspi/Halyk)",
      parseSMS: "Парсинг SMS",
      smsPlaceholder: "Вставьте банковский SMS...",
      parse: "Распознать",
      save: "Сохранить",
      cancel: "Отмена",
      preview: "Предпросмотр",
      income: "Доход",
      expense: "Расход",
      noTransactions: "Нет транзакций",
      saved: "Сохранено!",
      parseError: "Ошибка распознавания",
      total: "Итого",
    },
    en: {
      title: "Transactions",
      uploadCSV: "Upload CSV (Kaspi/Halyk)",
      parseSMS: "Parse SMS",
      smsPlaceholder: "Paste bank SMS here...",
      parse: "Parse",
      save: "Save",
      cancel: "Cancel",
      preview: "Preview",
      income: "Income",
      expense: "Expense",
      noTransactions: "No transactions",
      saved: "Saved!",
      parseError: "Parse error",
      total: "Total",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then((d) => {
        setTransactions(d.transactions ?? [])
        setLoading(false)
      })
  }, [])

  function showMsg(text: string, type: "success" | "error") {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)

    const content = await file.text()
    const res = await fetch("/api/transactions/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "csv", content }),
    })
    const data = await res.json()

    if (data.transactions) {
      setPreview(data.transactions)
      setShowPreview(true)
    } else {
      showMsg(tx.parseError, "error")
    }
    setParsing(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handlePDF(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)

    const formData = new FormData()
    formData.append("pdf", file)

    const res = await fetch("/api/transactions/parse-pdf", {
      method: "POST",
      body: formData,
    })
    const data = await res.json()

    if (data.transactions) {
      setPreview(data.transactions)
      setShowPreview(true)
    } else {
      showMsg(data.error ?? tx.parseError, "error")
    }
    setParsing(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleSMS() {
    if (!smsText.trim()) return
    setParsing(true)

    const res = await fetch("/api/transactions/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "sms", content: smsText }),
    })
    const data = await res.json()

    if (data.transactions) {
      setPreview(data.transactions)
      setShowPreview(true)
      setShowSms(false)
      setSmsText("")
    } else {
      showMsg(tx.parseError, "error")
    }
    setParsing(false)
  }

  async function handleSavePreview() {
    setSaving(true)
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactions: preview.map((t) => ({ ...t, source: "parsed" })),
      }),
    })
    const data = await res.json()

    if (data.transactions) {
      setTransactions((prev) => [...(data.transactions ?? []), ...prev])
      setPreview([])
      setShowPreview(false)
      showMsg(tx.saved, "success")
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/transactions?id=${id}`, { method: "DELETE" })
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold">{tx.title}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm text-center ${
            message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">{tx.income}</span>
            </div>
            <p className="font-mono font-bold text-lg text-primary">{fmt(totalIncome)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="size-4 text-foreground/70" />
              <span className="text-xs text-muted-foreground">{tx.expense}</span>
            </div>
            <p className="font-mono font-bold text-lg">{fmt(totalExpense)}</p>
          </div>
        </div>

        {/* Импорт батырмалары */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
          >
            {parsing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {tx.uploadCSV}
          </button>
          <button
            onClick={() => setShowSms(!showSms)}
            disabled={parsing}
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
          >
            <MessageSquare className="size-4" />
            {tx.parseSMS}
          </button>
          <button
            onClick={() => pdfRef.current?.click()}
            disabled={parsing}
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
          >
            {parsing ? <Loader2 className="size-4 animate-spin" /> : <span>📄</span>}
            Kaspi PDF
          </button>
          <input ref={pdfRef} type="file" accept=".pdf" onChange={handlePDF} className="hidden" />
        </div>

        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleCSV} className="hidden" />

        {/* SMS форма */}
        {showSms && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <textarea
              placeholder={tx.smsPlaceholder}
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSMS}
                disabled={parsing || !smsText.trim()}
                className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {parsing ? <Loader2 className="size-4 animate-spin mx-auto" /> : tx.parse}
              </button>
              <button
                onClick={() => { setShowSms(false); setSmsText("") }}
                className="rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted/40 transition"
              >
                {tx.cancel}
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        {showPreview && preview.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-medium">{tx.preview} ({preview.length})</p>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {preview.map((t, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-lg">{CATEGORY_ICONS[t.category] ?? "📦"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.date} · {CATEGORY_LABELS[t.category]?.[locale] ?? t.category}</p>
                  </div>
                  <p className={`font-mono text-sm font-bold shrink-0 ${t.type === "income" ? "text-primary" : "text-foreground"}`}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border flex gap-2">
              <button
                onClick={handleSavePreview}
                disabled={saving}
                className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin mx-auto" /> : `${tx.save} (${preview.length})`}
              </button>
              <button
                onClick={() => { setPreview([]); setShowPreview(false) }}
                className="rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted/40 transition"
              >
                {tx.cancel}
              </button>
            </div>
          </div>
        )}

        {/* Транзакциялар тізімі */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{tx.title}</p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">{tx.noTransactions}</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xl shrink-0">{CATEGORY_ICONS[transaction.category] ?? "📦"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{transaction.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.date} · {CATEGORY_LABELS[transaction.category]?.[locale] ?? transaction.category}
                    </p>
                  </div>
                  <p className={`font-mono text-sm font-bold shrink-0 ${
                    transaction.type === "income" ? "text-primary" : "text-foreground/80"
                  }`}>
                    {transaction.type === "income" ? "+" : "-"}{fmt(transaction.amount)}
                  </p>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <Trash2 className="size-3.5" />
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
