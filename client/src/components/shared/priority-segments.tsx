import { cn } from '@/lib/utils'
import { PRIORIDADE_MAX } from '@/lib/constants'

type PrioritySegmentsProps = { value: number; size?: 'sm' | 'md'; className?: string }

export function PrioritySegments({ value, size = 'sm', className }: PrioritySegmentsProps) {
  return (
    <div
      role="img"
      aria-label={`Prioridade ${value} de ${PRIORIDADE_MAX}`}
      className={cn('flex gap-0.5', className)}
    >
      {Array.from({ length: PRIORIDADE_MAX }, (_, i) => (
        <span
          key={i}
          className={cn(
            'rounded-[1px]',
            size === 'sm' ? 'h-4 w-2.5' : 'h-7 w-5',
            i < value ? 'bg-foreground' : 'bg-muted',
          )}
        />
      ))}
    </div>
  )
}