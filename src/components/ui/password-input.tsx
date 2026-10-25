import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Campo password con interruttore mostra/nascondi.
 *
 * Il pulsante è fuori dall'ordine di tabulazione (tabIndex -1): da tastiera
 * si passa da password direttamente al pulsante di invio, senza inciampare
 * in un controllo che serve solo al mouse e al tocco.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visibile, setVisibile] = React.useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={visibile ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisibile((v) => !v)}
        aria-label={visibile ? "Nascondi password" : "Mostra password"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {visibile ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  )
}
