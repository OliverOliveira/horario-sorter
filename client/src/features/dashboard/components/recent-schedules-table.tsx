import { Copy, Download, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants, Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PaginationBar } from '@/components/shared/pagination-bar'
import { Panel } from '@/components/shared/panel'
import { RowMenu } from '@/components/shared/row-menu'
import { SearchInput } from '@/components/shared/search-input'
import { StatusTag } from '@/components/shared/status-tag'
import { usePagination } from '@/hooks/use-pagination'
import type { HorarioGerado } from '../types'

const colunas: Column<HorarioGerado>[] = [
  {
    id: 'periodo',
    header: 'Período',
    cell: (h) => (
      <div>
        <div className="font-medium">{h.periodo}</div>
        <div className="text-muted-foreground tabular-nums">{h.intervalo}</div>
      </div>
    ),
  },
  { id: 'turmas', header: 'Turmas', cell: (h) => h.turmas },
  { id: 'data', header: 'Data & Hora', cell: (h) => <span className="tabular-nums">{h.dataHora}</span> },
  { id: 'conflitos', header: 'Conflitos', cell: (h) => h.conflitos },
  { id: 'estado', header: 'Estado', cell: (h) => <StatusTag variant={h.estado} /> },
  {
    id: 'acoes',
    header: 'Ações',
    align: 'right',
    cell: (h) => (
      <div className="flex items-center justify-end gap-1">
        <Link to={`/horarios?id=${h.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Abrir
        </Link>
        <RowMenu
          items={[
            { label: 'Duplicar', icon: Copy },
            { label: 'Exportar PDF', icon: Download },
            { label: 'Eliminar', icon: Trash2 },
          ]}
        />
      </div>
    ),
  },
]

const PAGE_SIZE = 4

export function RecentSchedulesTable({ horarios }: { horarios: HorarioGerado[] }) {
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return horarios
    return horarios.filter((h) => `${h.turmas} ${h.periodo}`.toLowerCase().includes(termo))
  }, [horarios, busca])

  const paginacao = usePagination(filtrados, PAGE_SIZE)

  return (
    <Panel
      eyebrow="Histórico de processamento"
      title="Últimos Horários Gerados"
      action={
        <div className="flex items-center gap-2">
          <SearchInput
            className="w-64"
            placeholder="Filtrar por turma ou período…"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              paginacao.reset()
            }}
          />
          <Button variant="outline" size="icon" aria-label="Mais filtros">
            <SlidersHorizontal />
          </Button>
        </div>
      }
      footer={
        <PaginationBar
          summary={`Exibindo ${paginacao.pageItems.length} de ${paginacao.total} execuções registadas`}
          page={paginacao.page}
          pageCount={paginacao.pageCount}
          onPrev={paginacao.prev}
          onNext={paginacao.next}
        />
      }
    >
      <DataTable columns={colunas} rows={paginacao.pageItems} getRowId={(h) => h.id} />
    </Panel>
  )
}