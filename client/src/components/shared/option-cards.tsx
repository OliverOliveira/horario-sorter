import { cn } from '@/lib/utils'

type Option<T extends string> = { value: T; label: string; description?: string }

type OptionCardsProps<T extends string> = {
  options: Option<T>[]
  value: T | undefined
  onChange: (value: T) => void
  ariaLabel?: string
}

export function OptionCards<T extends string>({ options, value, onChange, ariaLabel }: OptionCardsProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid gap-1 rounded-[4px] border bg-background p-1"
      style={{ gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const selecionado = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selecionado}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-[4px] px-3 py-2.5 text-center transition-colors',
              selecionado ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <div className="text-sm font-semibold uppercase tracking-wide">{o.label}</div>
            {o.description && (
              <div className="text-xs tabular-nums text-muted-foreground">{o.description}</div>
            )}
          </button>
        )
      })}
    </div>
  )
}