import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/data-table'
import { DayChips } from '@/components/shared/day-chips'
import { InitialsAvatar } from '@/components/shared/initials-avatar'
import { PrioritySegments } from '@/components/shared/priority-segments'
import { RowMenu } from '@/components/shared/row-menu'
import { StatusTag } from '@/components/shared/status-tag'
import { Tag } from '@/components/shared/tag'
import type { Professor } from '../types'
import { codigoProfessor, estadoProfessor, iniciais } from '../utils'

type ProfessoresTableProps = {
  professores: Professor[]
  empty: string
  onEditar: (professor: Professor) => void
  onEliminar: (professor: Professor) => void
}

export function ProfessoresTable({ professores, empty, onEditar, onEliminar }: ProfessoresTableProps) {
  const colunas: Column<Professor>[] = [
    {
      id: 'nome',
      header: 'Nome & Identificação',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <InitialsAvatar text={iniciais(p.nome)} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{p.nome}</span>
              <Tag mono>{codigoProfessor(p.id)}</Tag>
            </div>
            {p.email && <div className="text-sm text-muted-foreground">{p.email}</div>}
          </div>
        </div>
      ),
    },
    {
      id: 'disciplinas',
      header: 'Disciplinas',
      cell: (p) =>
        p.disciplinas.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex max-w-56 flex-wrap gap-1.5">
            {p.disciplinas.map((d) => (
              <Tag key={d.id}>{d.nome}</Tag>
            ))}
          </div>
        ),
    },
    { id: 'dias', header: 'Dias preferenciais', cell: (p) => <DayChips value={p.dias_preferenciais} /> },
    {
      id: 'prioridade',
      header: 'Prioridade',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="w-6 font-medium tabular-nums">P{p.prioridade}</span>
          <PrioritySegments value={p.prioridade} />
        </div>
      ),
    },
    { id: 'estado', header: 'Estado', cell: (p) => <StatusTag variant={estadoProfessor(p)} /> },
    {
      id: 'acoes',
      header: 'Ações',
      align: 'right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label={`Editar ${p.nome}`} onClick={() => onEditar(p)}>
            <Pencil />
          </Button>
          <RowMenu items={[{ label: 'Eliminar', icon: Trash2, onSelect: () => onEliminar(p) }]} />
        </div>
      ),
    },
  ]

  return <DataTable columns={colunas} rows={professores} getRowId={(p) => p.id} empty={empty} />
}