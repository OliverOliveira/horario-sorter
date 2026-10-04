import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SectionLabel } from './section-label'

type FormFieldProps = {
  label: string
  htmlFor?: string
  aside?: ReactNode
  hint?: string
  error?: string | null
  className?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, aside, hint, error, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor}>
          <SectionLabel>{label}</SectionLabel>
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}