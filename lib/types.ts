export type Locale = "kk" | "ru" | "en"

export type ThemeMode = "dark" | "light"

export type AgeGroup =
  | "student-5-14"
  | "student-15-20"
  | "adult-21-25"
  | "adult-26-37"
  | "adult-38-plus"

export type IncomeBracket =
  // Adult brackets (KZT / month)
  | "50k-200k"
  | "210k-350k"
  | "360k-500k"
  | "500k-1m"
  | "1m-plus"
  // Student brackets
  | "school-student"
  | "stipend-0-50k"
  | "stipend-50k-100k"
  | "stipend-other"

export type AuthMode = "login" | "register"

export interface UserProfile {
  name: string | null
  email: string | null
  authMode: AuthMode | null
  locale: Locale
  ageGroup: AgeGroup | null
  incomeBracket: IncomeBracket | null
  customIncome: number | null
  // Income range numeric estimate (midpoint, in KZT)
  estimatedIncome: number | null
}

export interface Expense {
  id: string
  category: string
  amount: number
  note?: string
  createdAt: number
}

export interface Goal {
  id: string
  title: string
  price: number
  createdAt: number
}

export type OnboardingStep =
  | "welcome"
  | "theme"
  | "auth"
  | "language"
  | "age"
  | "income"
  | "intro-expenses"
  | "intro-goals"
  | "done"
