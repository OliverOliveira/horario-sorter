import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type TagProps = { children: ReactNode; onRemove?: () => void; mono?: boolean; className?: string }

export function Tag({ children, onRemove, mono, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-[3px] border bg-secondary/40 px-2 py-1 text-sm leading-tight',
        mono && 'py-0.5 text-[11px] text-muted-foreground',
        className,
      )}
    >
      <span className="min-w-0">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remover"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}