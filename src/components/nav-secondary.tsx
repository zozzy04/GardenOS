"use client"

import type { ReactNode } from "react"

export type NavSecondaryItem = {
  id: string
  title: string
  icon?: ReactNode
}

/** Non renderizza nulla: evita 404 HMR se qualcosa importa ancora questo modulo. */
export function NavSecondary(_props: {
  items: NavSecondaryItem[]
  className?: string
  onNavigate?: (id: string) => void
}): null {
  return null
}
