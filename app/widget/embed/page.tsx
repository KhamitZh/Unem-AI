"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Target } from "lucide-react"

function fmt(n: number): string {
  if (!n || n <= 0) return "0 ₸"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`
  if (n >= 1_000) return `${Math.round(n / 1000)}k ₸`
  return `${n} ₸`
}

export default function EmbedWidget() {
  const [finances, setFinances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/finances")
      .then((r) => r.json())
      .then((d) => {
        setFinances(d.finances ?? [])
        setLoading(false)
      })
  }, [])

  const incomes = finances.filter((f) => f.type === "income")
  const expenses = finances.filter((f) => f.type === "expense")
  const goals = finances.filter((f) => f.type === "goal")

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const savings = Math.max(totalIncome - totalExpenses, 0)
  const topGoal = goals[0]
  const monthsToGoal = topGoal && savings > 0 ? Math.ceil(topGoal.amount / savings) : null

  if (loading) return (
    <div style={{ fontFamily: "sans-serif", padding: "16px", background: "#0f1117", color: "white", borderRadius: "16px" }}>
      <p style={{ color: "#9ca3af", fontSize: "14px" }}>Жүктелуде...</p>
    </div>
  )

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "16px",
      background: "linear-gradient(135deg, #0f1117, #1a1d2e)",
      color: "white",
      borderRadius: "16px",
      border: "1px solid #2d3148",
      maxWidth: "320px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: "8px", padding: "4px 10px" }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: "13px" }}>Unem AI</span>
        </div>
        <span style={{ color: "#9ca3af", fontSize: "12px" }}>Қаржы шолу</span>
      </div>

      {/* Жинақ */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        borderRadius: "12px",
        padding: "12px 16px",
        marginBottom: "12px",
      }}>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", margin: "0 0 4px" }}>Ай сайынғы жинақ</p>
        <p style={{ color: "white", fontSize: "22px", fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{fmt(savings)}</p>
      </div>

      {/* Кіріс / Шығыс */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        <div style={{ background: "#1a1d2e", border: "1px solid #2d3148", borderRadius: "10px", padding: "10px" }}>
          <p style={{ color: "#9ca3af", fontSize: "10px", margin: "0 0 4px", textTransform: "uppercase" }}>Кіріс</p>
          <p style={{ color: "#6366f1", fontWeight: 700, fontSize: "14px", margin: 0, fontFamily: "monospace" }}>{fmt(totalIncome)}</p>
        </div>
        <div style={{ background: "#1a1d2e", border: "1px solid #2d3148", borderRadius: "10px", padding: "10px" }}>
          <p style={{ color: "#9ca3af", fontSize: "10px", margin: "0 0 4px", textTransform: "uppercase" }}>Шығыс</p>
          <p style={{ color: "#e5e7eb", fontWeight: 700, fontSize: "14px", margin: 0, fontFamily: "monospace" }}>{fmt(totalExpenses)}</p>
        </div>
      </div>

      {/* Мақсат */}
      {topGoal && (
        <div style={{ background: "#1a1d2e", border: "1px solid #2d3148", borderRadius: "10px", padding: "10px", marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <p style={{ color: "#e5e7eb", fontSize: "12px", margin: 0 }}>{topGoal.title}</p>
            {monthsToGoal && (
              <p style={{ color: "#a78bfa", fontSize: "11px", margin: 0 }}>≈ {monthsToGoal} ай</p>
            )}
          </div>
          <div style={{ background: "#2d3148", borderRadius: "999px", height: "4px" }}>
            <div style={{
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              height: "4px",
              borderRadius: "999px",
              width: `${Math.min((savings / Math.max(topGoal.amount / 12, 1)) * 100, 100)}%`,
            }} />
          </div>
        </div>
      )}

      {/* Сілтеме */}
      <a
        href="https://unem-ai.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          textAlign: "center",
          color: "#6366f1",
          fontSize: "12px",
          textDecoration: "none",
        }}
      >
        unem-ai.vercel.app →
      </a>
    </div>
  )
}
