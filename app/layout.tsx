import type { Metadata, Viewport } from "next"
import { Manrope, Instrument_Serif } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import Script from "next/script"

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
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Unem AI — Жеке қаржы ИИ-кеңесшің",
    description: "Unem AI — қазақстандық қолданушыларға арналған заманауи ИИ-кеңесші",
    images: ["/logo.png"],
  },
  
  title: "Unem AI — Жеке қаржы ИИ-кеңесшің",
  description:
    "Unem AI — қазақстандық қолданушыларға арналған заманауи ИИ-кеңесші: үнемдеу, мақсатқа жинау, инвестициялық сауаттылық.",
  generator: "Zhanuzakov KH",
  applicationName: "Unem AI",
  keywords: [
    "Unem AI",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('SW registered'); })
                    .catch(function(err) { console.log('SW error:', err); });
                });
              }
            `,
          }}
        />

        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        
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
