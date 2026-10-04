import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { SectionLabel } from './section-label'

type InfoCardProps = { title: string; icon?: LucideIcon; children: ReactNode; footer?: ReactNode }

export function InfoCard({ title, icon: Icon, children, footer }: InfoCardProps) {
  return (
    <section className="flex flex-col rounded-lg border bg-card p-5">
      <header className="mb-3 flex items-center justify-between">
        <SectionLabel>{title}</SectionLabel>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </header>
      <div className="flex-1 text-sm leading-relaxed">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </section>
  )
}