import { MoreVertical, type LucideIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type RowMenuItem = { label: string; icon?: LucideIcon; onSelect?: () => void }

export function RowMenu({ items, label = 'Mais ações' }: { items: RowMenuItem[]; label?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={label} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
        <MoreVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map(({ label, icon: Icon, onSelect }) => (
          <DropdownMenuItem key={label} onClick={onSelect}>
            {Icon && <Icon />}
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}