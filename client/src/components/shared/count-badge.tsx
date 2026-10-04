export function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[3px] bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
      {children}
    </span>
  )
}