import type { ReactNode } from 'react'
import { SectionLabel } from './section-label'
import { Tag } from './tag'

type TableCaptionProps = { title: string; tag?: string; aside?: ReactNode }

export function TableCaption({ title, tag, aside }: TableCaptionProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
      <div className="flex items-center gap-3">
        <SectionLabel>{title}</SectionLabel>
        {tag && <Tag mono>{tag}</Tag>}
      </div>
      {aside && <SectionLabel>{aside}</SectionLabel>}
    </div>
  )
}