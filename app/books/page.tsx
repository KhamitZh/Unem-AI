"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Search, Star, Check, Clock, Sparkles, ChevronDown } from "lucide-react"
import { useApp } from "@/lib/store"
import { t } from "@/lib/i18n"

const CATEGORIES = [
  { key: "all", kk: "Бәрі", ru: "Все", en: "All" },
  { key: "mindset", kk: "Менталитет", ru: "Мышление", en: "Mindset" },
  { key: "investing", kk: "Инвестиция", ru: "Инвестиции", en: "Investing" },
  { key: "personal_finance", kk: "Жеке қаржы", ru: "Личные финансы", en: "Personal Finance" },
  { key: "entrepreneurship", kk: "Кәсіпкерлік", ru: "Предпринимательство", en: "Entrepreneurship" },
  { key: "real_estate", kk: "Жылжымайтын мүлік", ru: "Недвижимость", en: "Real Estate" },
  { key: "debt", kk: "Қарыз", ru: "Долги", en: "Debt" },
  { key: "fire", kk: "Ерте зейнет", ru: "Ранняя пенсия", en: "FIRE" },
  { key: "economics", kk: "Экономика", ru: "Экономика", en: "Economics" },
  { key: "crypto", kk: "Крипто", ru: "Крипто", en: "Crypto" },
  { key: "career", kk: "Карьера", ru: "Карьера", en: "Career" },
  { key: "family", kk: "Отбасы", ru: "Семья", en: "Family" },
  { key: "psychology", kk: "Психология", ru: "Психология", en: "Psychology" },
  { key: "business", kk: "Бизнес", ru: "Бизнес", en: "Business" },
]

const LEVELS = [
  { key: "all", kk: "Бәрі", ru: "Все", en: "All" },
  { key: "beginner", kk: "Жаңадан бастаушы", ru: "Начинающий", en: "Beginner" },
  { key: "intermediate", kk: "Орта деңгей", ru: "Средний", en: "Intermediate" },
  { key: "advanced", kk: "Жоғары деңгей", ru: "Продвинутый", en: "Advanced" },
]

const STATUS_CONFIG = {
  want: { icon: BookOpen, kk: "Оқығым келеді", ru: "Хочу читать", en: "Want to read" },
  reading: { icon: Clock, kk: "Оқып жатырмын", ru: "Читаю", en: "Reading" },
  done: { icon: Check, kk: "Оқыдым", ru: "Прочитал", en: "Done" },
}

const COVER_EMOJIS: Record<string, string> = {
  mindset: "🧠", investing: "📈", personal_finance: "💰",
  entrepreneurship: "🚀", real_estate: "🏠", debt: "💳",
  fire: "🔥", economics: "🌍", crypto: "₿", career: "💼",
  family: "👨‍👩‍👧", psychology: "🎯", business: "🏢",
  risk: "⚠️", marketing: "📣", management: "📋",
  accounting: "📊", taxes: "📝", retirement: "🌅",
  relationships: "🤝", negotiation: "🤝", habits: "⚡",
  productivity: "⚙️", leadership: "👑", lifestyle: "✨",
}

export default function BooksPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [level, setLevel] = useState("all")
  const [showAI, setShowAI] = useState(false)
  const [problem, setProblem] = useState("")
  const [aiBooks, setAiBooks] = useState<any[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)

  const labels = {
    kk: {
      title: "Кітаптар",
      search: "Кітап іздеу...",
      aiRecommend: "AI кеңесі",
      problemPlaceholder: "Қандай мәселеңіз бар? (мысалы: қарызым көп, жинақ жасай алмаймын...)",
      getRecommendations: "Кітап ұсын",
      noBooks: "Кітап табылмады",
      myBooks: "Менің кітаптарым",
      allBooks: "Барлық кітаптар",
      aiSuggestions: "AI ұсынған кітаптар",
      whyThisBook: "Неге бұл кітап?",
      level: "Деңгей",
      category: "Категория",
    },
    ru: {
      title: "Книги",
      search: "Поиск книг...",
      aiRecommend: "Совет AI",
      problemPlaceholder: "Какая у вас проблема? (например: много долгов, не могу копить...)",
      getRecommendations: "Подобрать книги",
      noBooks: "Книги не найдены",
      myBooks: "Мои книги",
      allBooks: "Все книги",
      aiSuggestions: "Книги от AI",
      whyThisBook: "Почему эта книга?",
      level: "Уровень",
      category: "Категория",
    },
    en: {
      title: "Books",
      search: "Search books...",
      aiRecommend: "AI Advice",
      problemPlaceholder: "What's your problem? (e.g. too much debt, can't save money...)",
      getRecommendations: "Get recommendations",
      noBooks: "No books found",
      myBooks: "My books",
      allBooks: "All books",
      aiSuggestions: "AI recommended books",
      whyThisBook: "Why this book?",
      level: "Level",
      category: "Category",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  useEffect(() => {
    loadBooks()
  }, [category, level, search])

  async function loadBooks() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("locale", locale)
    if (category !== "all") params.set("category", category)
    if (level !== "all") params.set("level", level)
    if (search) params.set("search", search)

    const res = await fetch(`/api/books?${params}`)
    const data = await res.json()
    setBooks(data.books ?? [])
    setLoading(false)
  }

  async function handleAIRecommend() {
    if (!problem.trim()) return
    setAiLoading(true)

    const res = await fetch("/api/books/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem, finances: {} }),
    })
    const data = await res.json()
    setAiBooks(data.books ?? [])
    setAiLoading(false)
  }

  async function handleStatusChange(bookId: string, status: string) {
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, status }),
    })
    setBooks((prev) => prev.map((b) =>
      b.id === bookId ? { ...b, userStatus: { status } } : b
    ))
    if (selectedBook?.id === bookId) {
      setSelectedBook((prev: any) => ({ ...prev, userStatus: { status } }))
    }
  }

  async function handleRating(bookId: string, rating: number) {
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, status: "done", rating }),
    })
    setBooks((prev) => prev.map((b) =>
      b.id === bookId ? { ...b, userStatus: { status: "done", rating } } : b
    ))
  }

  const displayBooks = aiBooks.length > 0 ? aiBooks : books

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">{tx.title}</h1>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{books.length} кітап</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* AI кеңес */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
          <button
            onClick={() => setShowAI(!showAI)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors"
          >
            <Sparkles className="size-5 text-primary" />
            <span className="font-medium text-sm flex-1 text-left">{tx.aiRecommend}</span>
            <ChevronDown className={`size-4 text-muted-foreground transition-transform ${showAI ? "rotate-180" : ""}`} />
          </button>

          {showAI && (
            <div className="px-4 pb-4 space-y-3 border-t border-primary/20">
              <textarea
                placeholder={tx.problemPlaceholder}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={3}
                className="w-full mt-3 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
              />
              <button
                onClick={handleAIRecommend}
                disabled={aiLoading || !problem.trim()}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {aiLoading ? "AI ойланып жатыр..." : tx.getRecommendations}
              </button>
              {aiBooks.length > 0 && (
                <button
                  onClick={() => setAiBooks([])}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition"
                >
                  {tx.allBooks} →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Іздеу */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={tx.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Категориялар */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {cat[locale as keyof typeof cat]}
            </button>
          ))}
        </div>

        {/* Деңгей */}
        <div className="flex gap-2">
          {LEVELS.map((lv) => (
            <button
              key={lv.key}
              onClick={() => setLevel(lv.key)}
              className={`flex-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                level === lv.key
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {lv[locale as keyof typeof lv]}
            </button>
          ))}
        </div>

        {/* AI ұсыныстар белгісі */}
        {aiBooks.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs text-primary font-medium">{tx.aiSuggestions}</span>
          </div>
        )}

        {/* Кітаптар тізімі */}
        {loading ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">Жүктелуде...</p>
          </div>
        ) : displayBooks.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="size-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{tx.noBooks}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayBooks.map((book) => (
              <div
                key={book.id}
                className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedBook(selectedBook?.id === book.id ? null : book)}
              >
                <div className="p-4 flex gap-4">
                  {/* Cover */}
                  <div
                    className="size-16 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: `${book.cover_color}20`, border: `1px solid ${book.cover_color}40` }}
                  >
                    {COVER_EMOJIS[book.category] ?? "📚"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm leading-tight">{book.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
                      </div>
                      {book.userStatus && (
                        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          book.userStatus.status === "done" ? "bg-green-500/10 text-green-500" :
                          book.userStatus.status === "reading" ? "bg-blue-500/10 text-blue-500" :
                          "bg-muted/50 text-muted-foreground"
                        }`}>
                          {STATUS_CONFIG[book.userStatus.status as keyof typeof STATUS_CONFIG]?.[locale as "kk" | "ru" | "en"] ?? book.userStatus.status}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{book.benefit}</p>

                    {/* AI reason */}
                    {book.reason && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <Sparkles className="size-3 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-primary">{book.reason}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        book.level === "beginner" ? "bg-green-500/10 text-green-500" :
                        book.level === "intermediate" ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        {LEVELS.find((l) => l.key === book.level)?.[locale as keyof (typeof LEVELS)[0]] ?? book.level}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {CATEGORIES.find((c) => c.key === book.category)?.[locale as keyof (typeof CATEGORIES)[0]] ?? book.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded view */}
                {selectedBook?.id === book.id && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    <p className="text-sm text-muted-foreground">{book.description}</p>

                    {/* Статус батырмалары */}
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                        <button
                          key={status}
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(book.id, status) }}
                          className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                            book.userStatus?.status === status
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                          }`}
                        >
                          <config.icon className="size-4" />
                          {config[locale as "kk" | "ru" | "en"]}
                        </button>
                      ))}
                    </div>

                    {/* Рейтинг */}
                    {book.userStatus?.status === "done" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Бағалау:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={(e) => { e.stopPropagation(); handleRating(book.id, star) }}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                className={`size-5 ${
                                  star <= (book.userStatus?.rating ?? 0)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
