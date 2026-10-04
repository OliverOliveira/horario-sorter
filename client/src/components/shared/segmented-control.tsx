import { cn } from '@/lib/utils'

type Option<T extends string> = { value: T; label: string }

type SegmentedControlProps<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
  fill?: boolean                      // novo
}

export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel, fill }: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('divide-x overflow-hidden rounded-[4px] border bg-card', fill ? 'flex w-full' : 'inline-flex')}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-8 px-3 text-sm transition-colors',
            o.value === value
              ? 'bg-muted font-medium text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}