import type { LucideIcon } from 'lucide-react'
import { SectionLabel } from './section-label'

type StatCardProps = { label: string; value: number | string; icon: LucideIcon; hint?: string }

export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <SectionLabel>{label}</SectionLabel>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && (
        <div className="mt-4 flex items-center gap-2 border-t border-dashed pt-3 text-sm text-muted-foreground">
          <span className="size-1.5 rounded-full bg-current" />
          {hint}
        </div>
      )}
    </div>
  )
}