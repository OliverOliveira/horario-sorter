import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export type StatusVariant = 'ativo' | 'pendente' | 'conflito'

const labels: Record<StatusVariant, string> = {
  ativo: 'Ativo',
  pendente: 'Pendente',
  conflito: 'Conflito',
}

const tagVariants = cva(
  'inline-flex items-center gap-1 rounded-[3px] border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide whitespace-nowrap',
  {
    variants: {
      variant: {
        ativo: 'border-transparent bg-foreground text-background',
        pendente: 'border-border bg-transparent text-muted-foreground',
        conflito: 'border-foreground/60 bg-hatch text-foreground',
      },
    },
  },
)

type StatusTagProps = { variant: StatusVariant; children?: ReactNode; className?: string }

export function StatusTag({ variant, children, className }: StatusTagProps) {
  return (
    <span className={cn(tagVariants({ variant }), className)}>
      {variant === 'conflito' && <AlertTriangle className="size-3" />}
      {children ?? labels[variant]}
    </span>
  )
}