import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tag } from './tag'

type FormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  code?: string
  description: string
  submitLabel: string
  submitting?: boolean
  onSubmit: () => void
  children: ReactNode
}

export function FormSheet({
  open,
  onOpenChange,
  title,
  code,
  description,
  submitLabel,
  submitting,
  onSubmit,
  children,
}: FormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="space-y-1 border-b px-6 py-4 pr-12 text-left">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-xl font-semibold tracking-tight">{title}</SheetTitle>
            {code && <Tag mono>{code}</Tag>}
          </div>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">{children}</div>
          <div className="flex justify-end gap-2 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              <Check />
              {submitLabel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}