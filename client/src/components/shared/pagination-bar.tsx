import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'

type PaginationBarProps = {
  summary: ReactNode
  page: number
  pageCount: number
  onPrev: () => void
  onNext: () => void
}

export function PaginationBar({ summary, page, pageCount, onPrev, onNext }: PaginationBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>{summary}</span>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
          Anterior
        </Button>
        <span className="tabular-nums text-foreground">
          {page} / {pageCount}
        </span>
        <Button variant="outline" size="sm" onClick={onNext} disabled={page >= pageCount}>
          Próximo
        </Button>
      </div>
    </div>
  )
}