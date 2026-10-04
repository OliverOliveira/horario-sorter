import { cn } from '@/lib/utils'

type ProgressBarProps = { value: number; tone?: 'strong' | 'soft'; className?: string }

export function ProgressBar({ value, tone = 'strong', className }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-[2px] bg-muted', className)}
    >
      <div
        className={cn('h-full', tone === 'strong' ? 'bg-foreground' : 'bg-muted-foreground')}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}