import type { Metadata, Viewport } from "next"
import { Manrope, Instrument_Serif } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans-custom",
  display: "swap",
})

const display = Instrument_Serif({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  variable: "--font-display-custom",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ҮнемАІ — Жеке қаржы ИИ-кеңесшің",
  description:
    "ҮнемАІ — қазақстандық қолданушыларға арналған заманауи ИИ-кеңесші: үнемдеу, мақсатқа жинау, инвестициялық сауаттылық.",
  generator: "v0.app",
  applicationName: "ҮнемАІ",
  keywords: [
    "ҮнемАІ",
    "финансы",
    "qarjy",
    "savings",
    "AI",
    "инвестиции",
    "Kazakhstan",
  ],
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e12" },
  ],
  width: "device-width",
  initialScale: 1,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="kk"
      suppressHydrationWarning
      className={`${manrope.variable} ${display.variable} bg-background`}
    >
      <body className="min-h-dvh font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
