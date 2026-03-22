import { Leaf } from "lucide-react"

export function FullScreenLoader({ message = "Caricamento..." }: { message?: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-background px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <div className="relative">
        <div
          className="absolute inset-0 animate-ping rounded-2xl bg-primary/25"
          style={{ animationDuration: "2s" }}
        />
        <div className="relative flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
          <Leaf className="size-8 animate-pulse" strokeWidth={1.75} />
        </div>
      </div>
      <p className="text-center text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  )
}
