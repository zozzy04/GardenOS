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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageContainer, PageHeader } from '@/components/page-layout'
import { toastError, toastSuccess } from '@/lib/notify'

type PendingRow = {
  user_id: string
  display_name: string | null
  famiglia_id: string | null
  created_at: string
}

type FamigliaRow = { id: string; nome: string }

export function AdminApprovals() {
  const [rows, setRows] = React.useState<PendingRow[]>([])
  const [famiglie, setFamiglie] = React.useState<FamigliaRow[]>([])
  const [scelte, setScelte] = React.useState<Record<string, string>>({})
  const [loading, setLoading] = React.useState(true)
  const [acting, setActing] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    const [pending, famiglieRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, display_name, famiglia_id, created_at')
        .eq('role', 'condomino')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: true }),
      supabase.from('famiglie').select('id, nome').order('ordine', { ascending: true }),
    ])

    if (pending.error) {
      console.error(pending.error)
      toastError('Impossibile caricare le richieste')
      setRows([])
    } else {
      const list = (pending.data as PendingRow[]) ?? []
      setRows(list)
      // Preseleziona la famiglia già associata, se c'è
      setScelte(
        Object.fromEntries(
          list.filter((r) => r.famiglia_id).map((r) => [r.user_id, r.famiglia_id as string])
        )
      )
    }

    if (famiglieRes.error) {
      console.error(famiglieRes.error)
      toastError('Impossibile caricare le famiglie')
      setFamiglie([])
    } else {
      setFamiglie((famiglieRes.data as FamigliaRow[]) ?? [])
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
      target_famiglia: scelte[userId] ?? null,
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
        description="Assegna a ogni richiesta la sua unità millesimale, poi approva. Approva solo se conosci la persona."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">In attesa</CardTitle>
          <CardDescription>
            Senza famiglia assegnata «Il mio conto» resterebbe vuoto, perciò
            l&apos;approvazione richiede una scelta.
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
                  <div className="min-w-0 space-y-2 text-sm">
                    <p className="font-medium">
                      {row.display_name?.trim() || 'Senza nome'}{' '}
                      <span className="font-normal text-muted-foreground">
                        ({row.user_id.slice(0, 8)}…)
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Richiesta: {new Date(row.created_at).toLocaleString('it-IT')}
                    </p>
                    <Select
                      value={scelte[row.user_id] ?? ''}
                      onValueChange={(v) =>
                        setScelte((prev) => ({ ...prev, [row.user_id]: v }))
                      }
                      disabled={acting === row.user_id || famiglie.length === 0}
                    >
                      <SelectTrigger className="w-full sm:w-[260px]">
                        <SelectValue placeholder="Assegna una famiglia" />
                      </SelectTrigger>
                      <SelectContent>
                        {famiglie.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={acting === row.user_id || !scelte[row.user_id]}
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
