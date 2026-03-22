import * as React from "react"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"

/** Sfondo e safe-area comuni a login, registrazione e schermate gate. */
export function AuthShell({
  children,
  className,
  showThemeToggle = true,
}: {
  children: React.ReactNode
  className?: string
  showThemeToggle?: boolean
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-svh w-full flex-col items-center justify-center overflow-x-hidden px-4 py-8",
        "pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]",
        className
      )}
    >
      {showThemeToggle ? (
        <div className="absolute right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-20 sm:right-4">
          <ModeToggle />
        </div>
      ) : null}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[20%] -top-[10%] h-[min(520px,90vw)] w-[min(520px,90vw)] rounded-full bg-primary/[0.12] blur-[80px]" />
        <div className="absolute -bottom-[15%] -right-[15%] h-[min(440px,85vw)] w-[min(440px,85vw)] rounded-full bg-accent/[0.35] blur-[72px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/60 dark:via-background dark:to-background" />
      </div>
      {children}
    </div>
  )
}
