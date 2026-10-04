import { useMemo, useState } from 'react'

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(page, pageCount)

  const pageItems = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize],
  )

  return {
    page: current,
    pageCount,
    pageItems,
    total: items.length,
    prev: () => setPage(Math.max(current - 1, 1)),
    next: () => setPage(Math.min(current + 1, pageCount)),
    reset: () => setPage(1),
  }
}