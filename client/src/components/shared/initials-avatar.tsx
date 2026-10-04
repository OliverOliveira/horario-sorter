export function InitialsAvatar({ text }: { text: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-[4px] border bg-background text-sm font-medium">
      {text}
    </span>
  )
}