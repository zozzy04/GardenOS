import * as React from "react"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"

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
        "relative flex min-h-svh w-full flex-col items-center justify-center overflow-x-hidden px-5 py-10",
        "pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]",
        className
      )}
    >
      {showThemeToggle ? (
        <div className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 sm:right-5">
          <ModeToggle />
        </div>
      ) : null}

      {/* Atmospheric background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[25%] -top-[15%] h-[min(600px,90vw)] w-[min(600px,90vw)] rounded-full bg-primary/[0.08] blur-[100px]" />
        <div className="absolute -bottom-[20%] -right-[20%] h-[min(500px,80vw)] w-[min(500px,80vw)] rounded-full bg-chart-4/[0.12] blur-[90px]" />
        <div className="absolute left-1/2 top-1/3 h-[min(300px,60vw)] w-[min(300px,60vw)] -translate-x-1/2 rounded-full bg-chart-2/[0.06] blur-[80px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background to-background dark:from-background dark:via-background dark:to-background" />
      </div>

      {children}
    </div>
  )
}
