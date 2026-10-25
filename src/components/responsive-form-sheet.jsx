import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

/**
 * Form di inserimento: bottom sheet su telefono, dialog su desktop.
 *
 * Sostituisce il pattern «card che si apre in cima alla pagina», che su mobile
 * spingeva giù la lista e costringeva a uno scrollIntoView differito per
 * riportare l'utente sul form.
 *
 * I campi restano montati solo quando è aperto: lo stato del form vive nel
 * componente padre, quindi non si perde nulla alla chiusura.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} props.children — i campi
 * @param {React.ReactNode} [props.footer] — i pulsanti di conferma
 */
export function ResponsiveFormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-heading text-lg">{title}</DrawerTitle>
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">{children}</div>
          {footer ? (
            <DrawerFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle className="font-heading text-lg">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <DialogFooter className="border-t border-border px-6 py-4">{footer}</DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
