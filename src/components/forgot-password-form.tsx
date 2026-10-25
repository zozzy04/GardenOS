import * as React from "react"
import { Leaf, Loader2Icon, MailCheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthShell } from "@/components/auth-shell"
import { AuthFooter } from "@/components/auth-footer"
import { useAuth } from "../hooks/useSupabase"

export function ForgotPasswordForm({
  onBack,
  className,
}: {
  onBack: () => void
  className?: string
}) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [inviata, setInviata] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    await resetPassword(email)
    setLoading(false)
    /* Mostrato anche se l'indirizzo non esiste: un messaggio diverso nei due
       casi rivelerebbe chi ha un account. */
    setInviata(true)
  }

  return (
    <AuthShell className={cn("gap-6", className)}>
      <div className="w-full max-w-[min(100%,400px)] sm:max-w-sm">
        <div className="flex flex-col gap-5 sm:gap-6">
          <Card className="border-border/50 shadow-xl shadow-primary/5 dark:border-border/40 dark:shadow-none">
            <CardHeader className="space-y-4 pb-2">
              <div className="flex justify-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                  {inviata ? (
                    <MailCheckIcon className="size-7" strokeWidth={2.25} />
                  ) : (
                    <Leaf className="size-7" strokeWidth={2.25} />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-center font-heading text-2xl font-semibold tracking-tight">
                  {inviata ? "Controlla la posta" : "Password dimenticata"}
                </CardTitle>
                <CardDescription className="text-balance text-center text-[0.9375rem]">
                  {inviata
                    ? "Se l'indirizzo è registrato riceverai un link per scegliere una nuova password."
                    : "Ti mandiamo un link per reimpostarla."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {inviata ? (
                <Button variant="outline" className="h-11 w-full sm:h-10" onClick={onBack}>
                  Torna al login
                </Button>
              ) : (
                <form onSubmit={handleSubmit}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
                      <Input
                        id="forgot-email"
                        name="email"
                        type="email"
                        placeholder="nome@esempio.it"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        disabled={loading}
                        className="h-11 sm:h-10"
                      />
                      <FieldDescription>
                        Usa l&apos;indirizzo con cui ti sei registrato.
                      </FieldDescription>
                    </Field>
                    <Field>
                      <Button
                        type="submit"
                        className="mt-1 h-11 w-full text-[0.9375rem] font-medium sm:h-10 sm:text-sm"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2Icon className="animate-spin" />
                            Invio in corso...
                          </>
                        ) : (
                          "Invia il link"
                        )}
                      </Button>
                    </Field>
                  </FieldGroup>
                </form>
              )}
            </CardContent>
          </Card>

          {!inviata && (
            <p className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={onBack}
              >
                Torna al login
              </button>
            </p>
          )}

          <AuthFooter />
        </div>
      </div>
    </AuthShell>
  )
}
