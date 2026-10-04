import { DIAS_SEMANA } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function DayChips({ value, className }: { value: number[]; className?: string }) {
  return (
    <div className={cn('flex gap-1', className)}>
      {DIAS_SEMANA.map((d) => (
        <span
          key={d.value}
          className={cn(
            'rounded-[3px] border px-1.5 py-0.5 text-xs',
            value.includes(d.value)
              ? 'border-transparent bg-foreground font-medium text-background'
              : 'text-muted-foreground',
          )}
        >
          {d.short}
        </span>
      ))}
    </div>
  )
}

type DayToggleProps = { value: number[]; onChange: (dias: number[]) => void }

export function DayToggle({ value, onChange }: DayToggleProps) {
  return (
    <div role="group" aria-label="Dias preferenciais" className="grid grid-cols-5 gap-2">
      {DIAS_SEMANA.map((d) => {
        const ativo = value.includes(d.value)
        return (
          <button
            key={d.value}
            type="button"
            aria-pressed={ativo}
            title={d.label}
            onClick={() =>
              onChange(
                ativo
                  ? value.filter((v) => v !== d.value)
                  : [...value, d.value].sort((a, b) => a - b),
              )
            }
            className={cn(
              'h-10 rounded-[4px] border text-sm transition-colors',
              ativo
                ? 'border-transparent bg-foreground font-medium text-background'
                : 'bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {d.short}
          </button>
        )
      })}
    </div>
  )
}