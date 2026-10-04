import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/data-table'
import { RowMenu } from '@/components/shared/row-menu'
import type { Turma } from '../types'
import { rotuloTurma } from '../utils'

type TurmasTableProps = {
  turmas: Turma[]
  empty: string
  onEditar: (turma: Turma) => void
  onEliminar: (turma: Turma) => void
}

const vazio = <span className="text-muted-foreground">—</span>

export function TurmasTable({ turmas, empty, onEditar, onEliminar }: TurmasTableProps) {
  const colunas: Column<Turma>[] = [
    {
      id: 'turma',
      header: 'Turma',
      cell: (t) => (
        <div>
          <div className="font-medium">{rotuloTurma(t)}</div>
          <div className="text-sm text-muted-foreground">
            Turma {t.nome}
            {t.alunos ? ` • ${t.alunos} alunos` : ''}
          </div>
        </div>
      ),
    },
    {
      id: 'classe',
      header: 'Classe',
      cell: (t) => (
        <span className="rounded-[3px] bg-muted px-2 py-0.5 text-sm font-medium">{t.classe}</span>
      ),
    },
    { id: 'curso', header: 'Curso', cell: (t) => t.curso },
    { id: 'area', header: 'Área de formação', cell: (t) => t.area_formacao ?? vazio },
    {
      id: 'sala',
      header: 'Sala',
      cell: (t) =>
        t.sala ? (
          <span className="inline-flex items-center gap-2 rounded-[3px] border bg-background px-2 py-1 text-sm">
            <span className="size-1.5 rounded-full bg-foreground" />
            {t.sala}
          </span>
        ) : (
          vazio
        ),
    },
    {
      id: 'periodo',
      header: 'Período',
      cell: (t) => (
        <span className="rounded-[3px] bg-muted px-2 py-1 text-xs font-semibold uppercase tracking-wide">
          {t.periodo}
        </span>
      ),
    },
    {
      id: 'acoes',
      header: 'Ações',
      align: 'right',
      cell: (t) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label={`Editar ${rotuloTurma(t)}`} onClick={() => onEditar(t)}>
            <Pencil />
          </Button>
          <RowMenu items={[{ label: 'Eliminar', icon: Trash2, onSelect: () => onEliminar(t) }]} />
        </div>
      ),
    },
  ]

  return <DataTable columns={colunas} rows={turmas} getRowId={(t) => t.id} empty={empty} />
}