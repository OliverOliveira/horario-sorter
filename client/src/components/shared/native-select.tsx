import type { ComponentProps } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NativeSelect({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className={cn('relative', className)}>
      <select
        className="h-8 w-full appearance-none rounded-[4px] border bg-background pr-8 pl-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        {...props}
      >
        {children}
      </select>
      <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}