"use client"

import { motion } from "framer-motion"
import type { UIMessage } from "ai"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AIOrb } from "@/components/ai-orb"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/store"

function getText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .replace(/<memory_update>[\s\S]*?<\/memory_update>/g, "")
    .replace(/<daily_analysis>[\s\S]*?<\/daily_analysis>/g, "")
    .trim()
}

interface Props {
  message: UIMessage
  streaming?: boolean
}

export function MessageBubble({ message, streaming }: Props) {
  const { profile } = useApp()
  const isUser = message.role === "user"
  const text = getText(message)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "group flex gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && <AIOrb size={32} className="mt-1" />}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm md:text-base",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground shadow-glow"
            : "rounded-tl-sm border border-border bg-card/70 text-foreground backdrop-blur",
        )}
      >
        {!isUser && (
          <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Unem AI
          </div>
        )}

        {isUser ? (
          <div className="whitespace-pre-wrap text-pretty">
            {text}
          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-foreground">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-muted-foreground">{children}</em>
              ),
              h1: ({ children }) => (
                <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-bold mb-2 mt-3 first:mt-0 text-primary">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold mb-1.5 mt-2 first:mt-0">{children}</h3>
              ),
              ul: ({ children }) => (
                <ul className="mb-2 space-y-1 pl-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-2 space-y-1 pl-1 list-decimal list-inside">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1 shrink-0">•</span>
                  <span>{children}</span>
                </li>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-")
                if (isBlock) {
                  return (
                    <code className="block bg-muted/50 rounded-xl px-4 py-3 text-xs font-mono my-2 overflow-x-auto whitespace-pre">
                      {children}
                    </code>
                  )
                }
                return (
                  <code className="bg-muted/50 rounded-md px-1.5 py-0.5 text-xs font-mono text-primary">
                    {children}
                  </code>
                )
              },
              pre: ({ children }) => (
                <pre className="bg-muted/50 rounded-xl p-4 my-2 overflow-x-auto text-xs font-mono">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary pl-3 my-2 text-muted-foreground italic">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-2">
                  <table className="w-full text-xs border-collapse">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-border bg-muted/50 px-3 py-2 text-left font-semibold">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border border-border px-3 py-2">{children}</td>
              ),
              hr: () => <hr className="border-border my-3" />,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80 transition-opacity">
                  {children}
                </a>
              ),
            }}
          >
            {text}
          </ReactMarkdown>
        )}

        {streaming && (
          <span className="ml-0.5 inline-block h-4 w-[2px] -mb-0.5 bg-primary animate-blink align-middle" />
        )}
      </div>

      {isUser && (
        <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
          {(profile.name?.[0] ?? "?").toUpperCase()}
        </div>
      )}
    </motion.div>
  )
}
