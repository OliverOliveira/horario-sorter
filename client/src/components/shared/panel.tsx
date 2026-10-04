import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SectionLabel } from './section-label'

type PanelProps = {
  eyebrow?: string
  title: string
  badge?: ReactNode
  action?: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({ eyebrow, title, badge, action, footer, className, children }: PanelProps) {
  return (
    <section className={cn('rounded-lg border bg-card', className)}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-5">
        <div className="space-y-1">
          {eyebrow && <SectionLabel>{eyebrow}</SectionLabel>}
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {badge}
          </div>
        </div>
        {action}
      </header>
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <footer className="mx-6 border-t border-dashed py-4 text-sm text-muted-foreground">
          {footer}
        </footer>
      )}
    </section>
  )
}