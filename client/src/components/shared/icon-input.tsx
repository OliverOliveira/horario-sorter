import type { ComponentProps } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type IconInputProps = ComponentProps<typeof Input> & { icon: LucideIcon }

export function IconInput({ icon: Icon, className, ...props }: IconInputProps) {
  return (
    <div className="relative">
      <Input className={cn('pr-9', className)} {...props} />
      <Icon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
