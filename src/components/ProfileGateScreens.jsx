import { GaugeIcon, Leaf, ShieldOff } from 'lucide-react'
import { AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function GateCard({ icon, title, description, onLogout }) {
  return (
    <Card className="w-full max-w-md border-border/80 shadow-lg shadow-primary/5 dark:shadow-none">
      <CardHeader className="space-y-3 text-center sm:space-y-4">
        {icon ? (
          <div className="flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted ring-1 ring-border/80">
              {icon}
            </div>
          </div>
        ) : null}
        <CardTitle className="font-sans text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </CardTitle>
        <CardDescription className="text-balance text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          variant="outline"
          className="h-11 w-full sm:h-10"
          onClick={() => onLogout()}
        >
          Esci
        </Button>
      </CardContent>
    </Card>
  )
}

export function ProfileMissing({ onLogout }) {
  return (
    <AuthShell>
      <GateCard
        icon={<Leaf className="size-8 text-primary" strokeWidth={2.25} />}
        title="Profilo non configurato"
        description="Non risulta un profilo collegato al tuo account. Contatta il gestore del condominio o verifica che lo script SQL su Supabase sia stato eseguito correttamente."
        onLogout={onLogout}
      />
    </AuthShell>
  )
}

export function PendingApproval({ onLogout }) {
  return (
    <AuthShell>
      <GateCard
        icon={<GaugeIcon className="size-8 text-warning" />}
        title="In attesa di approvazione"
        description="La tua registrazione è stata ricevuta. L&apos;amministratore deve approvare l&apos;accesso prima che tu possa consultare il tuo conto."
        onLogout={onLogout}
      />
    </AuthShell>
  )
}

export function AccessRejected({ onLogout }) {
  return (
    <AuthShell>
      <GateCard
        icon={<ShieldOff className="size-8 text-destructive" strokeWidth={1.75} />}
        title="Accesso non consentito"
        description="La richiesta di accesso non è stata approvata. Per maggiori informazioni contatta il gestore del giardino."
        onLogout={onLogout}
      />
    </AuthShell>
  )
}
