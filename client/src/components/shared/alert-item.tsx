import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { StatusTag } from './status-tag'

type AlertItemProps = {
  variant: 'pendente' | 'conflito'
  title: string
  description: string
  actionLabel: string
  to: string
}

export function AlertItem({ variant, title, description, actionLabel, to }: AlertItemProps) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-dashed py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <StatusTag variant={variant} />
          <span className="font-medium">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Link to={to} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0')}>
        {actionLabel}
        <ChevronRight />
      </Link>
    </li>
  )
}