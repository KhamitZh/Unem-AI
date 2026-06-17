"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MessageSquare, Heart, Trash2, Send, Users } from "lucide-react"
import { useApp } from "@/lib/store"
import { useSubscription } from "@/lib/use-subscription"
import { UpgradeModal } from "@/components/subscription/upgrade-modal"

const CATEGORIES = [
  { key: "all", kk: "Бәрі", ru: "Все", en: "All" },
  { key: "general", kk: "Жалпы", ru: "Общее", en: "General" },
  { key: "tip", kk: "Кеңес", ru: "Советы", en: "Tips" },
  { key: "goal", kk: "Мақсат", ru: "Цели", en: "Goals" },
  { key: "success", kk: "Жетістік", ru: "Успехи", en: "Success" },
  { key: "question", kk: "Сұрақ", ru: "Вопросы", en: "Questions" },
]

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-muted/50 text-muted-foreground",
  tip: "bg-blue-500/10 text-blue-400",
  goal: "bg-purple-500/10 text-purple-400",
  success: "bg-green-500/10 text-green-500",
  question: "bg-yellow-500/10 text-yellow-400",
}

export default function CommunityPage() {
  const router = useRouter()
  const { profile } = useApp()
  const locale = profile.locale
  const { isPro } = useSubscription()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("all")
  const [content, setContent] = useState("")
  const [postCategory, setPostCategory] = useState("general")
  const [sending, setSending] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [openComments, setOpenComments] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [commentInput, setCommentInput] = useState("")
  const [sendingComment, setSendingComment] = useState(false)

  async function loadComments(postId: string) {
    const res = await fetch(`/api/community/comments?post_id=${postId}`)
    const data = await res.json()
    setComments((prev) => ({ ...prev, [postId]: data.comments ?? [] }))
  }

  async function sendComment(postId: string) {
    if (!commentInput.trim()) return
    setSendingComment(true)
    const res = await fetch("/api/community/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, content: commentInput.trim() }),
    })
    const data = await res.json()
    if (data.comment) {
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), data.comment] }))
      setCommentInput("")
    }
    setSendingComment(false)
  }

  function toggleComments(postId: string) {
    if (openComments === postId) {
      setOpenComments(null)
    } else {
      setOpenComments(postId)
      if (!comments[postId]) loadComments(postId)
    }
  }

  const labels = {
    kk: {
      title: "Қоғамдастық",
      subtitle: "Қаржылық кеңестер мен тәжірибе бөлісіңіз",
      placeholder: "Кеңесіңізді немесе тәжірибеңізді бөлісіңіз...",
      send: "Жіберу",
      noPosts: "Әлі жазба жоқ. Бірінші болыңыз!",
      proOnly: "Жазба жазу үшін Pro керек",
      justNow: "Дәл қазір",
      minutesAgo: "мин бұрын",
      hoursAgo: "сағ бұрын",
      daysAgo: "күн бұрын",
    },
    ru: {
      title: "Сообщество",
      subtitle: "Делитесь финансовыми советами и опытом",
      placeholder: "Поделитесь советом или опытом...",
      send: "Отправить",
      noPosts: "Записей пока нет. Будьте первым!",
      proOnly: "Для публикации нужен Pro",
      justNow: "Только что",
      minutesAgo: "мин назад",
      hoursAgo: "ч назад",
      daysAgo: "дн назад",
    },
    en: {
      title: "Community",
      subtitle: "Share financial tips and experiences",
      placeholder: "Share your tip or experience...",
      send: "Send",
      noPosts: "No posts yet. Be the first!",
      proOnly: "Pro required to post",
      justNow: "Just now",
      minutesAgo: "min ago",
      hoursAgo: "h ago",
      daysAgo: "d ago",
    },
  }

  const tx = labels[locale as keyof typeof labels] ?? labels.ru

  const totalComments = Object.values(comments).reduce((s, arr) => s + (arr?.length ?? 0), 0)

  useEffect(() => {
    loadPosts()
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setCurrentUserId(d.userId))
  }, [category])

  async function loadPosts() {
    setLoading(true)
    const res = await fetch(`/api/community?category=${category}`)
    const data = await res.json()
    setPosts(data.posts ?? [])
    setLoading(false)
  }

  async function handleSend() {
    if (!content.trim()) return
    if (!isPro) {
      setShowUpgrade(true)
      return
    }
    setSending(true)
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", content: content.trim(), category: postCategory }),
    })
    const data = await res.json()
    if (data.post) {
      setPosts((prev) => [{ ...data.post, isLiked: false }, ...prev])
      setContent("")
    }
    setSending(false)
  }

  async function handleLike(postId: string) {
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like", postId }),
    })
    const data = await res.json()
    setPosts((prev) => prev.map((p) =>
      p.id === postId
        ? { ...p, isLiked: data.liked, likes: data.liked ? p.likes + 1 : p.likes - 1 }
        : p
    ))
  }

  async function handleDelete(postId: string) {
    await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", postId }),
    })
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return tx.justNow
    if (diff < 3600) return `${Math.floor(diff / 60)} ${tx.minutesAgo}`
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${tx.hoursAgo}`
    return `${Math.floor(diff / 86400)} ${tx.daysAgo}`
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-muted/40 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">{tx.title}</h1>
        </div>
        <button
          onClick={() => setOpenComments(openComments ? null : (posts[0]?.id ?? null))}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            openComments
              ? "bg-primary/10 text-primary"
              : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
          }`}
        >
          <MessageSquare className="size-3.5" />
          {totalComments}
        </button>
        <span className="ml-auto text-xs text-muted-foreground">{posts.length}</span>
      </div>  

      

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        <p className="text-sm text-muted-foreground text-center">{tx.subtitle}</p>

        {/* Жазба жазу */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.slice(1).map((cat) => (
              <button
                key={cat.key}
                onClick={() => setPostCategory(cat.key)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  postCategory === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {cat[locale as keyof typeof cat]}
              </button>
            ))}
          </div>

          <textarea
            placeholder={isPro ? tx.placeholder : tx.proOnly}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onClick={() => { if (!isPro) setShowUpgrade(true) }}
            readOnly={!isPro}
            rows={3}
            className={`w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none ${
              !isPro ? "opacity-60 cursor-pointer" : ""
            }`}
          />

          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="size-4" />
            {sending ? "..." : tx.send}
          </button>
        </div>

        {/* Категория filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
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

        {/* Постар */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {locale === "kk" ? "Жүктелуде..." : locale === "ru" ? "Загрузка..." : "Loading..."}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <MessageSquare className="size-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{tx.noPosts}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {(post.profiles?.name?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{post.profiles?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.general}`}>
                      {CATEGORIES.find((c) => c.key === post.category)?.[locale as keyof (typeof CATEGORIES)[0]] ?? post.category}
                    </span>
                    {post.user_id === currentUserId && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm leading-relaxed">{post.content}</p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      post.isLiked
                        ? "bg-red-500/10 text-red-400"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    <Heart className={`size-3.5 ${post.isLiked ? "fill-red-400" : ""}`} />
                    {post.likes ?? 0}
                  </button>
                </div>
                {openComments === post.id && (
                  <div className="border-t border-border pt-3 space-y-3">
                    {(comments[post.id] ?? []).map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2">
                        <div className="size-6 rounded-full bg-primary/15 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                          {(comment.profiles?.name?.[0] ?? "?").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground">{comment.profiles?.name ?? "—"}</p>
                          <p className="text-xs leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={locale === "kk" ? "Комментарий..." : locale === "ru" ? "Комментарий..." : "Comment..."}
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendComment(post.id)}
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary transition-colors"
                      />
                      <button
                        onClick={() => sendComment(post.id)}
                        disabled={sendingComment || !commentInput.trim()}
                        className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition disabled:opacity-50"
                      >
                        <Send className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpgrade && <UpgradeModal reason="analytics" onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
