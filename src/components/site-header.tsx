import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150 transition-[height] ease-linear">
      <div className="flex w-full min-w-0 items-center gap-2 px-4 sm:px-6 lg:gap-3 lg:px-8">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator
          orientation="vertical"
          className="mx-1 hidden h-5 sm:block"
        />
        <h1 className="min-w-0 flex-1 truncate font-heading text-[0.9375rem] font-medium tracking-tight text-foreground sm:text-base">
          {title}
        </h1>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
