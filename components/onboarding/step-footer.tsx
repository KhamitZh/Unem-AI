"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { t } from "@/lib/i18n"
import type { Locale } from "@/lib/types"

interface StepFooterProps {
  onBack?: () => void
  onNext?: () => void
  nextDisabled?: boolean
  nextLabel?: string
  locale: Locale
  hideBack?: boolean
}

export function StepFooter({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  locale,
  hideBack,
}: StepFooterProps) {
  return (
    <div className="mt-10 flex items-center justify-between gap-3">
      {!hideBack ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="mr-1.5 size-4" />
          {t(locale, "back")}
        </Button>
      ) : (
        <span />
      )}
      <Button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="h-11 rounded-full px-6 shadow-glow"
      >
        {nextLabel ?? t(locale, "continue")}
        <ArrowRight className="ml-1.5 size-4" />
      </Button>
    </div>
  )
}
