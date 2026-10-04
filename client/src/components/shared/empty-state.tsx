import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { SectionLabel } from './section-label'

type EmptyStateProps = {
  icon?: LucideIcon
  overline?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function EmptyState({ icon: Icon, overline, title, description, actions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-card px-6 py-14 text-center">
      {Icon && <Icon className="mb-3 size-10 text-muted-foreground/60" strokeWidth={1} />}
      {overline && <SectionLabel>{overline}</SectionLabel>}
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {actions && <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}