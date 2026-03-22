import * as React from 'react'
import { Loader2Icon, CheckIcon, XIcon } from 'lucide-react'
import { supabase } from '../config/supabase'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageContainer, PageHeader } from '@/components/page-layout'
import { toastError, toastSuccess } from '@/lib/notify'

type PendingRow = {
  user_id: string
  display_name: string | null
  famiglia_id: string | null
  created_at: string
  famiglie: { nome: string } | { nome: string }[] | null
}

function famigliaNome(row: PendingRow): string {
  const f = row.famiglie
  if (!f) return '—'
  if (Array.isArray(f)) return f[0]?.nome ?? '—'
  return f.nome ?? '—'
}

export function AdminApprovals() {
  const [rows, setRows] = React.useState<PendingRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [acting, setActing] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, display_name, famiglia_id, created_at, famiglie ( nome )')
      .eq('role', 'condomino')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      toastError('Impossibile caricare le richieste')
      setRows([])
    } else {
      setRows((data as PendingRow[]) ?? [])
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  async function setStatus(userId: string, status: 'approved' | 'rejected') {
    setActing(userId)
    const { error } = await supabase.rpc('admin_set_profile_approval', {
      target_user: userId,
      new_status: status,
    })
    setActing(null)
    if (error) {
      console.error(error)
      toastError(error.message || 'Operazione non riuscita')
      return
    }
    toastSuccess(status === 'approved' ? 'Condomino approvato' : 'Richiesta rifiutata')
    await load()
  }

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Approvazioni condomini"
        description="Utenti in attesa con ruolo condomino. Approva solo se conosci la richiesta."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">In attesa</CardTitle>
          <CardDescription>
            Puoi gestire gli stati anche dalla tabella <code className="text-xs">profiles</code> in
            Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2Icon className="size-5 animate-spin" />
              Caricamento...
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna richiesta in sospeso.</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li
                  key={row.user_id}
                  className="flex flex-col gap-4 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0 space-y-1 text-sm">
                    <p className="font-medium">
                      {row.display_name?.trim() || 'Senza nome'}{' '}
                      <span className="font-normal text-muted-foreground">
                        ({row.user_id.slice(0, 8)}…)
                      </span>
                    </p>
                    <p className="text-muted-foreground">Famiglia: {famigliaNome(row)}</p>
                    <p className="text-xs text-muted-foreground">
                      Richiesta: {new Date(row.created_at).toLocaleString('it-IT')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={acting === row.user_id}
                      onClick={() => setStatus(row.user_id, 'approved')}
                    >
                      <CheckIcon className="size-4" />
                      Approva
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={acting === row.user_id}
                      onClick={() => setStatus(row.user_id, 'rejected')}
                    >
                      <XIcon className="size-4" />
                      Rifiuta
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
