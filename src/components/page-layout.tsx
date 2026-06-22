import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ClassNameProp = { className?: string }

/** Contenitore contenuto pagina (padding orizzontale / max-width gestiti da Layout). */
export function PageContainer({
  children,
  className,
}: { children: ReactNode } & ClassNameProp) {
  return (
    <div className={cn('w-full min-w-0 space-y-6 md:space-y-8', className)}>
      {children}
    </div>
  )
}

/** Titolo e descrizione pagina (stesso ritmo tipografico dell’area principale). */
export function PageHeader({
  title,
  description,
  icon,
  className,
}: {
  title: string
  description?: string
  icon?: ReactNode
} & ClassNameProp) {
  return (
    <header className={cn('space-y-2 sm:space-y-3', className)}>
      <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:gap-2.5 sm:text-2xl">
        {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
        <span>{title}</span>
      </h1>
      {description ? (
        <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </header>
  )
}

/** Footer fisso in fondo ad ogni pagina. */
export function PageFooter() {
  return (
    <footer className="mt-auto border-t border-border/30 py-5 text-center">
      <a
        href="https://riccardozozzolotto.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] tracking-wide text-muted-foreground/50 transition-colors hover:text-muted-foreground"
      >
        Powered by <span className="font-medium">Riccardo Zozzolotto</span>
      </a>
    </footer>
  )
}

/** Titolo + azioni su una riga da desktop. */
export function PageToolbar({
  children,
  className,
}: { children: ReactNode } & ClassNameProp) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6',
        className
      )}
    >
      {children}
    </div>
  )
}
