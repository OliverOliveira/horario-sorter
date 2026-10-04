import { Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tag } from './tag'

type Option = { id: number; label: string }

type TagMultiSelectProps = {
  options: Option[]
  value: number[]
  onChange: (ids: number[]) => void
  addLabel?: string
  emptyLabel?: string
}

export function TagMultiSelect({
  options,
  value,
  onChange,
  addLabel = 'Adicionar',
  emptyLabel = 'Nenhuma opção disponível',
}: TagMultiSelectProps) {
  const selecionadas = options.filter((o) => value.includes(o.id))
  const disponiveis = options.filter((o) => !value.includes(o.id))

  return (
    <div className="flex min-h-24 flex-wrap content-start gap-2 rounded-[4px] border bg-background p-3">
      {selecionadas.map((o) => (
        <Tag key={o.id} onRemove={() => onChange(value.filter((id) => id !== o.id))}>
          {o.label}
        </Tag>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-[3px] border border-dashed px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <Plus className="size-3.5" />
          {addLabel}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
          {disponiveis.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">{emptyLabel}</div>
          ) : (
            disponiveis.map((o) => (
              <DropdownMenuItem key={o.id} onClick={() => onChange([...value, o.id])}>
                {o.label}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}