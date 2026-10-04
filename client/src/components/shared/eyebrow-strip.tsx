import type { ReactNode } from 'react'
import { SectionLabel } from './section-label'

export function EyebrowStrip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-[4px] bg-surface-lowest px-4 py-2">
      <span className="size-1.5 rounded-full bg-foreground" />
      <SectionLabel>{children}</SectionLabel>
    </div>
  )
}
