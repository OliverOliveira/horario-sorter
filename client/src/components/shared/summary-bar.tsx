import { Fragment, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SummaryItem = { value: ReactNode; label: string }

export function SummaryBar({ items, aside, bare }: { items: SummaryItem[]; aside?: ReactNode; bare?: boolean }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 text-sm", bare && "border-b-0")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            <span className="flex items-center gap-2 text-muted-foreground">
              {i === 0 && <span className="size-1.5 rounded-full bg-foreground" />}
              <span className="font-medium text-foreground tabular-nums">{item.value}</span>
              {item.label}
            </span>
          </Fragment>
        ))}
      </div>
      {aside}
    </div>
  )
}