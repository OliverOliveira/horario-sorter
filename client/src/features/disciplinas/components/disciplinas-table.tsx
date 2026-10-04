import { Pencil, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/data-table'
import { StatusTag } from '@/components/shared/status-tag'
import { iconeDaArea } from '../icons'
import type { DisciplinaDetalhe } from '../types'
import { estadoDisciplina, rotuloDocentes, rotuloTempos } from '../utils'

type DisciplinasTableProps = {
  disciplinas: DisciplinaDetalhe[]
  empty: string
  onEditar: (disciplina: DisciplinaDetalhe) => void
  onEliminar: (disciplina: DisciplinaDetalhe) => void
}

const vazio = <span className="text-muted-foreground">—</span>

export function DisciplinasTable({ disciplinas, empty, onEditar, onEliminar }: DisciplinasTableProps) {
  const colunas: Column<DisciplinaDetalhe>[] = [
    {
      id: 'nome',
      header: 'Nome da disciplina',
      cell: (d) => {
        const Icon = iconeDaArea(d.area_curricular)
        return (
          <div className="flex items-center gap-3">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">{d.nome}</span>
          </div>
        )
      },
    },
    {
      id: 'sigla',
      header: 'Sigla',
      cell: (d) =>
        d.sigla ? (
          <span className="rounded-[3px] bg-muted px-2 py-1 text-sm font-medium tracking-wide">
            {d.sigla}
          </span>
        ) : (
          vazio
        ),
    },
    { id: 'area', header: 'Área curricular', cell: (d) => d.area_curricular ?? vazio },
    {
      id: 'professores',
      header: 'Nº de professores',
      cell: (d) => (
        <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-muted px-2 py-1 text-sm">
          <User className="size-3.5 text-muted-foreground" />
          {rotuloDocentes(d.total_professores)}
        </span>
      ),
    },
    {
      id: 'carga',
      header: 'Carga sem.',
      cell: (d) => <span className="text-muted-foreground">{rotuloTempos(d.carga_semanal)}</span>,
    },
    { id: 'estado', header: 'Estado', cell: (d) => <StatusTag variant={estadoDisciplina(d)} /> },
    {
      id: 'acoes',
      header: 'Ações',
      align: 'right',
      cell: (d) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label={`Editar ${d.nome}`} onClick={() => onEditar(d)}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Eliminar ${d.nome}`} onClick={() => onEliminar(d)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  return <DataTable columns={colunas} rows={disciplinas} getRowId={(d) => d.id} empty={empty} />
}