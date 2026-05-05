"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  AgeGroup,
  AuthMode,
  Expense,
  Goal,
  IncomeBracket,
  Locale,
  OnboardingStep,
  UserProfile,
} from "./types"

interface State {
  hydrated: boolean
  step: OnboardingStep
  profile: UserProfile
  expenses: Expense[]
  goals: Goal[]
  setStep: (s: OnboardingStep) => void
  updateProfile: (p: Partial<UserProfile>) => void
  setLocale: (l: Locale) => void
  setAuth: (data: { name: string; email: string; mode: AuthMode }) => void
  setAge: (a: AgeGroup) => void
  setIncome: (b: IncomeBracket, custom?: number | null) => void
  addExpensesFromText: (text: string) => Expense[]
  addGoalFromText: (text: string) => Goal | null
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => void
  removeExpense: (id: string) => void
  addGoal: (goal: Omit<Goal, "id" | "createdAt">) => void
  removeGoal: (id: string) => void
  updateIncome: (amount: number) => void
  reset: () => void
  setHydrated: () => void
}

const initialProfile: UserProfile = {
  name: null,
  email: null,
  authMode: null,
  locale: "kk",
  ageGroup: null,
  incomeBracket: null,
  customIncome: null,
  estimatedIncome: null,
}

const incomeMidpoints: Record<IncomeBracket, number> = {
  "50k-200k": 125_000,
  "210k-350k": 280_000,
  "360k-500k": 430_000,
  "500k-1m": 750_000,
  "1m-plus": 1_500_000,
  "school-student": 5_000,
  "stipend-0-50k": 25_000,
  "stipend-50k-100k": 75_000,
  "stipend-other": 0,
}

// Naive expense parser: pulls "<word(s)> <number>" pairs out of free text.
function parseExpenses(text: string): Expense[] {
  const cleaned = text.replace(/[,;\n]/g, " ")
  const re =
    /([\p{L}\p{M}'’-]+(?:\s+[\p{L}\p{M}'’-]+){0,2})\s*[-–—:]?\s*(\d{1,3}(?:[\s.]\d{3})+|\d{4,9})/gu
  const out: Expense[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(cleaned))) {
    const category = m[1].trim()
    const amount = Number(m[2].replace(/[\s.]/g, ""))
    if (Number.isFinite(amount) && amount > 0 && category.length > 1) {
      out.push({
        id: crypto.randomUUID(),
        category,
        amount,
        createdAt: Date.now(),
      })
    }
  }
  return out
}

function parseGoal(text: string): Goal | null {
  const cleaned = text.replace(/[,;\n]/g, " ")
  const numRe = /(\d{1,3}(?:[\s.]\d{3})+|\d{4,12})/g
  const nums = [...cleaned.matchAll(numRe)].map((m) =>
    Number(m[1].replace(/[\s.]/g, "")),
  )
  const price = nums.length ? Math.max(...nums) : 0
  const title =
    cleaned.replace(numRe, "").replace(/\s{2,}/g, " ").replace(/[-–—₸$]/g, "").trim() ||
    text.trim().slice(0, 60)
  if (!title) return null
  return {
    id: crypto.randomUUID(),
    title,
    price,
    createdAt: Date.now(),
  }
}

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      step: "welcome",
      profile: initialProfile,
      expenses: [],
      goals: [],
      setStep: (step) => set({ step }),
      updateProfile: (p) => set({ profile: { ...get().profile, ...p } }),
      setLocale: (locale) =>
        set({ profile: { ...get().profile, locale } }),
      setAuth: ({ name, email, mode }) =>
        set({
          profile: {
            ...get().profile,
            name,
            email,
            authMode: mode,
          },
        }),
      setAge: (ageGroup) =>
        set({ profile: { ...get().profile, ageGroup } }),
      setIncome: (incomeBracket, custom) => {
        const estimated =
          custom && custom > 0 ? custom : incomeMidpoints[incomeBracket]
        set({
          profile: {
            ...get().profile,
            incomeBracket,
            customIncome: custom ?? null,
            estimatedIncome: estimated,
          },
        })
      },
      addExpensesFromText: (text) => {
        const parsed = parseExpenses(text)
        if (parsed.length === 0) {
          // Fallback: store the whole text as a single "Other" expense placeholder.
          const fallback: Expense = {
            id: crypto.randomUUID(),
            category: text.slice(0, 60),
            amount: 0,
            createdAt: Date.now(),
            note: text,
          }
          set({ expenses: [...get().expenses, fallback] })
          return [fallback]
        }
        set({ expenses: [...get().expenses, ...parsed] })
        return parsed
      },
      addGoalFromText: (text) => {
        const goal = parseGoal(text)
        if (!goal) return null
        set({ goals: [...get().goals, goal] })
        return goal
      },
      addExpense: (expense) => {
        set({
          expenses: [
            ...get().expenses,
            { ...expense, id: crypto.randomUUID(), createdAt: Date.now() },
          ],
        })
      },
      removeExpense: (id) => {
        set({ expenses: get().expenses.filter((e) => e.id !== id) })
      },
      addGoal: (goal) => {
        set({
          goals: [
            ...get().goals,
            { ...goal, id: crypto.randomUUID(), createdAt: Date.now() },
          ],
        })
      },
      removeGoal: (id) => {
        set({ goals: get().goals.filter((g) => g.id !== id) })
      },
      updateIncome: (amount) => {
        set({
          profile: {
            ...get().profile,
            estimatedIncome: amount,
            customIncome: amount,
          },
        })
      },
      reset: () =>
        set({
          step: "welcome",
          profile: initialProfile,
          expenses: [],
          goals: [],
        }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "unemai-state-v1",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    },
  ),
)
