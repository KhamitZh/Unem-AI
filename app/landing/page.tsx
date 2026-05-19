"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  TrendingUp, TrendingDown, Target, BookOpen,
  Users, BarChart2, DollarSign, Shield, Zap,
  ChevronRight, Star, Check, ArrowRight
} from "lucide-react"

const FEATURES = [
  { icon: TrendingUp, title: "Кіріс & Шығыс", desc: "Барлық қаржыңызды бір жерде бақылаңыз", color: "text-primary" },
  { icon: Target, title: "Мақсат жоспары", desc: "AI мақсатқа жетудің нақты жолын көрсетеді", color: "text-accent" },
  { icon: BookOpen, title: "100+ Кітап", desc: "Қаржылық сауаттылыққа арналған кітаптар базасы", color: "text-emerald-400" },
  { icon: Users, title: "Отбасылық бюджет", desc: "Бүкіл отбасымен бірге қаржыны басқарыңыз", color: "text-pink-400" },
  { icon: BarChart2, title: "Талдау", desc: "Кіріс/шығыс диаграммалары мен болжамдар", color: "text-blue-400" },
  { icon: DollarSign, title: "Валюта бағамы", desc: "Нақты уақытта 10+ валюта бағамы", color: "text-yellow-400" },
  { icon: Shield, title: "Қауіпсіз", desc: "Деректеріңіз шифрланған және қорғалған", color: "text-green-400" },
  { icon: Zap, title: "AI кеңесші", desc: "Жеке AI кеңесші тәулік бойы қолжетімді", color: "text-purple-400" },
]

const STATS = [
  { value: "100+", label: "Қаржы кітаптары" },
  { value: "3", label: "Тіл қолдауы" },
  { value: "AI", label: "Жеке кеңесші" },
  { value: "24/7", label: "Қолжетімді" },
]

const TESTIMONIALS = [
  {
    name: "Айгерім С.",
    role: "Маркетолог",
    text: "Unem AI-дан кейін ай сайын 50,000 ₸ үнемдей бастадым. AI кеңестері өте нақты!",
    rating: 5,
    avatar: "А",
  },
  {
    name: "Берік М.",
    role: "Бизнесмен",
    text: "Отбасылық бюджет функциясы керемет. Барлық отбасым бірге қаржыны бақылап отырмыз.",
    rating: 5,
    avatar: "Б",
  },
  {
    name: "Дана К.",
    role: "IT маман",
    text: "Кітаптар базасы өте пайдалы. AI маған сай кітаптарды дәл тауып берді!",
    rating: 5,
    avatar: "Д",
  },
]

const PLANS = [
  {
    name: "Тегін",
    price: "0 ₸",
    period: "/ ай",
    features: [
      "AI чат кеңесші",
      "Кіріс & Шығыс бақылау",
      "10 кітап",
      "Валюта бағамы",
    ],
    cta: "Бастау",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "2,990 ₸",
    period: "/ ай",
    features: [
      "Барлық тегін мүмкіндіктер",
      "100+ кітап",
      "Отбасылық бюджет",
      "Талдау диаграммалары",
      "CSV/SMS импорт",
      "Ай сайынғы есеп",
    ],
    cta: "Pro таңдау",
    highlighted: true,
  },
  {
    name: "Отбасы",
    price: "4,990 ₸",
    period: "/ ай",
    features: [
      "Барлық Pro мүмкіндіктер",
      "5 мүше дейін",
      "Ортақ мақсаттар",
      "Отбасылық чат",
      "Геймификация",
      "Приоритетті қолдау",
    ],
    cta: "Отбасы таңдау",
    highlighted: false,
  },
]

export default function LandingPage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/90 backdrop-blur border-b border-border" : ""
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="font-bold text-lg">Unem AI</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/auth")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Кіру
            </button>
            <button
              onClick={() => router.push("/auth")}
              className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              Тегін бастау
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 size-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 size-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary mb-8">
            <Zap className="size-4" />
            <span>AI арқылы қаржылық бостандыққа жет</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Ақшаңды{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              ақылмен
            </span>{" "}
            басқар
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Жеке AI кеңесшің кіріс, шығыс, мақсаттарыңды талдап, байлыққа жетудің нақты жолын көрсетеді
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push("/auth")}
              className="w-full sm:w-auto rounded-full bg-gradient-to-r from-primary to-purple-600 text-white px-8 py-4 text-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              Тегін бастау
              <ArrowRight className="size-5" />
            </button>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full sm:w-auto rounded-full border border-border px-8 py-4 text-lg font-medium hover:bg-muted/40 transition"
            >
              Толығырақ білу
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-2xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Барлық керекті мүмкіндіктер</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Қаржылық сауаттылықтан байлыққа дейін — бәрі бір жерде
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card/50 p-6 hover:border-primary/30 hover:bg-card transition-all duration-300"
              >
                <div className={`size-10 rounded-xl bg-muted/50 flex items-center justify-center mb-4`}>
                  <feature.icon className={`size-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            AI кеңесшің — тәулік бойы қолжетімді
          </h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
            Кіріс, шығыс, мақсаттарыңды талдап, мақсатқа жету жолыңды есептеп, қаржылық жоспар жасап береді
          </p>

          {/* Chat preview */}
          <div className="rounded-2xl border border-border bg-card p-6 text-left max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-full bg-primary/15 flex items-center justify-center">
                <Zap className="size-4 text-primary" />
              </div>
              <span className="font-medium">Unem AI</span>
              <span className="size-2 rounded-full bg-green-400 animate-pulse ml-auto" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-xs">
                  Мен қашан үй алып ала аламын?
                </div>
              </div>
              <div className="flex gap-3">
                <div className="size-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Zap className="size-3.5 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-xs">
                  Сіздің кірісіңіз 350,000 ₸, шығысыңыз 220,000 ₸. Ай сайын 130,000 ₸ жинайсыз. 25M ₸ үйге <strong>16 жыл</strong> кетеді. Бірақ шығысты 20% азайтсаңыз — <strong>12 жылда</strong> жетесіз! 🏠
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Пайдаланушылар пікірі</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Қарапайым баға</h2>
            <p className="text-muted-foreground text-lg">Тегін бастаңыз, кейін кеңейтіңіз</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col ${
                  plan.highlighted
                    ? "border-primary bg-primary/5 relative"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground px-4 py-1 text-xs font-medium">
                    Ең танымал
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push("/auth")}
                  className={`w-full rounded-xl py-3 text-sm font-medium transition ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border hover:bg-muted/40"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Қаржылық бостандыққа бүгін бастаңыз
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Тегін тіркеліп, AI кеңесшіңізбен алғашқы қадам жасаңыз
          </p>
          <button
            onClick={() => router.push("/auth")}
            className="rounded-full bg-gradient-to-r from-primary to-purple-600 text-white px-10 py-4 text-lg font-semibold hover:opacity-90 transition flex items-center gap-2 mx-auto"
          >
            Тегін бастау
            <ArrowRight className="size-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">U</span>
            </div>
            <span className="font-semibold">Unem AI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 Unem AI. Барлық құқықтар қорғалған.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button onClick={() => router.push("/auth")} className="hover:text-foreground transition">Кіру</button>
            <button onClick={() => router.push("/auth")} className="hover:text-foreground transition">Тіркелу</button>
          </div>
        </div>
      </footer>

    </div>
  )
}
