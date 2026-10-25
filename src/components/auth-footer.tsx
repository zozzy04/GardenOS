import { FieldDescription } from "@/components/ui/field"

/**
 * Firma in fondo alle schermate di autenticazione.
 *
 * Era duplicata in due componenti con `text-muted-foreground/60`: quel 60%
 * di opacità su `--muted-foreground` scendeva sotto il rapporto di contrasto
 * minimo di WCAG AA, soprattutto in tema chiaro.
 */
export function AuthFooter() {
  return (
    <FieldDescription className="text-balance text-center text-[0.6875rem] tracking-wide text-muted-foreground">
      Powered by{" "}
      <a
        href="https://riccardozozzolotto.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
      >
        Riccardo Zozzolotto
      </a>
    </FieldDescription>
  )
}
