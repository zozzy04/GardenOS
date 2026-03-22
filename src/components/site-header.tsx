import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteHeader({ title }: { title: string }) {
  return (
    <header className="flex h-(--header-height) min-h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:min-h-14">
      <div className="flex w-full min-w-0 items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator
          orientation="vertical"
          className="mx-2 hidden h-4 sm:block"
        />
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground sm:text-[0.9375rem]">
          {title}
        </h1>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
