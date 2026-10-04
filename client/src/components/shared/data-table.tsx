import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type Column<T> = {
  id: string
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'right'
  className?: string
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  getRowId: (row: T) => string | number
  empty?: ReactNode
}

export function DataTable<T>({ columns, rows, getRowId, empty = 'Sem resultados.' }: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((c) => (
            <TableHead
              key={c.id}
              className={cn(
                'h-11 text-[11px] font-medium uppercase tracking-widest text-muted-foreground',
                c.align === 'right' && 'text-right',
                c.className,
              )}
            >
              {c.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
              {empty}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={getRowId(row)} className="border-dashed">
              {columns.map((c) => (
                <TableCell
                  key={c.id}
                  className={cn('py-4', c.align === 'right' && 'text-right', c.className)}
                >
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}