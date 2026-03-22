import * as React from "react"
import { Leaf, Loader2Icon } from "lucide-react"

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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthShell } from "@/components/auth-shell"

export type LoginFormProps = {
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  loading: boolean
  error: string
  className?: string
  onGoRegister?: () => void
}

/** Layout e componenti come blocco shadcn login-01; copy e logica GardenOS. */
export function LoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  loading,
  error,
  className,
  onGoRegister,
}: LoginFormProps) {
  return (
    <AuthShell className={cn("gap-6", className)}>
      <div className="w-full max-w-[min(100%,380px)] sm:max-w-sm">
        <div className="flex flex-col gap-5 sm:gap-6">
          <Card className="border-border/80 shadow-lg shadow-primary/5 dark:shadow-none">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex justify-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Leaf className="size-8" strokeWidth={2.25} />
                </div>
              </div>
              <CardTitle className="text-center font-sans text-2xl font-semibold tracking-tight">
                GardenOS
              </CardTitle>
              <CardDescription className="text-center text-base">
                Accedi al tuo account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit}>
                <FieldGroup>
                  {error ? <FieldError>{error}</FieldError> : null}
                  <Field>
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="nome@esempio.it"
                      value={email}
                      onChange={(e) => onEmailChange(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={loading}
                      className="h-11 min-h-11 sm:h-10"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="login-password">Password</FieldLabel>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      className="h-11 min-h-11 sm:h-10"
                    />
                  </Field>
                  <Field>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2Icon className="animate-spin" />
                          Caricamento...
                        </>
                      ) : (
                        "Accedi"
                      )}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          {onGoRegister ? (
            <p className="text-center text-sm text-muted-foreground">
              Non hai un account?{' '}
              <button
                type="button"
                className="font-medium text-primary underline underline-offset-2"
                onClick={onGoRegister}
              >
                Registrati
              </button>
            </p>
          ) : null}
          <FieldDescription className="text-balance text-center text-xs sm:text-sm">
            Powered by{" "}
            <span className="font-medium text-foreground">Riccardo Zozzolotto</span>
          </FieldDescription>
        </div>
      </div>
    </AuthShell>
  )
}
