import { Download, Plus, School } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { EyebrowStrip } from '@/components/shared/eyebrow-strip'
import { PaginationBar } from '@/components/shared/pagination-bar'
import { SearchInput } from '@/components/shared/search-input'
import { SegmentedControl } from '@/components/shared/segmented-control'
import { SummaryBar } from '@/components/shared/summary-bar'
import { TableCaption } from '@/components/shared/table-caption'
import { Tag } from '@/components/shared/tag'
import { usePeriodos } from '@/features/periodos/hooks'
import { usePagination } from '@/hooks/use-pagination'
import { ANO_LECTIVO } from '@/lib/constants'
import { downloadCsv } from '@/lib/download'
import { normalizar } from '@/lib/text'
import { TurmaSheet } from '../components/turma-sheet'
import { TurmasTable } from '../components/turmas-table'
import { useEliminarTurma, useTurmas } from '../hooks'
import type { Turma } from '../types'
import { rotuloTurma } from '../utils'

const PAGE_SIZE = 7
const TODOS = 'todos'

export function TurmasPage() {
  const { data: turmas = [], isLoading, isError, error } = useTurmas()
  const { data: periodos = [] } = usePeriodos()
  const eliminar = useEliminarTurma()

  const [busca, setBusca] = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState(TODOS)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [editando, setEditando] = useState<Turma | undefined>()
  const [chave, setChave] = useState(0) // muda a cada abertura para limpar o formulário
  const [aEliminar, setAEliminar] = useState<Turma | null>(null)

  const cursos = useMemo(() => [...new Set(turmas.map((t) => t.curso))].sort(), [turmas])
  const areas = useMemo(
    () => [...new Set(turmas.map((t) => t.area_formacao).filter((a): a is string => !!a))].sort(),
    [turmas],
  )

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim())
    return turmas.filter(
      (t) =>
        (filtroPeriodo === TODOS || String(t.periodo_id) === filtroPeriodo) &&
        (!termo || normalizar(`${rotuloTurma(t)} ${t.sala ?? ''}`).includes(termo)),
    )
  }, [turmas, busca, filtroPeriodo])

  const paginacao = usePagination(filtradas, PAGE_SIZE)
  const de = paginacao.total === 0 ? 0 : (paginacao.page - 1) * PAGE_SIZE + 1
  const ate = paginacao.total === 0 ? 0 : de + paginacao.pageItems.length - 1

  const mensagemVazia = isLoading
    ? 'A carregar turmas…'
    : isError
      ? `Não foi possível carregar: ${error.message}`
      : 'Nenhuma turma encontrada para este filtro.'

  function abrirSheet(turma?: Turma) {
    setEditando(turma)
    setChave((c) => c + 1)
    setSheetAberto(true)
  }

  function exportarCsv() {
    downloadCsv('turmas.csv', [
      ['Turma', 'Classe', 'Curso', 'Área de formação', 'Sala', 'Período', 'Alunos'],
      ...filtradas.map((t) => [t.nome, t.classe, t.curso, t.area_formacao, t.sala, t.periodo, t.alunos]),
    ])
  }

  const semTurmas = !isLoading && !isError && turmas.length === 0

  return (
    <div className="space-y-4">
      <EyebrowStrip>Organização escolar • Turmas e salas</EyebrowStrip>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border bg-card p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Turmas</h1>
            <Tag mono>Ano {ANO_LECTIVO}</Tag>
          </div>
          <SummaryBar
            bare
            items={[
              { value: turmas.length, label: 'turmas registadas' },
              ...periodos.map((p) => ({
                value: turmas.filter((t) => t.periodo_id === p.id).length,
                label: p.nome,
              })),
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            className="w-72"
            placeholder="Pesquisar turma, curso ou sala…"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              paginacao.reset()
            }}
          />
          <SegmentedControl
            ariaLabel="Filtrar por período"
            value={filtroPeriodo}
            onChange={(v) => {
              setFiltroPeriodo(v)
              paginacao.reset()
            }}
            options={[
              { value: TODOS, label: 'Todos' },
              ...periodos.map((p) => ({ value: String(p.id), label: p.nome })),
            ]}
          />
          <Button variant="outline" size="icon" aria-label="Exportar CSV" onClick={exportarCsv}>
            <Download />
          </Button>
          <Button onClick={() => abrirSheet()}>
            <Plus />
            Nova turma
          </Button>
        </div>
      </div>

      {semTurmas ? (
        <EmptyState
          icon={School}
          overline="Organização escolar"
          title="Ainda não há turmas registadas"
          description="Registe a primeira turma para começar a definir as atribuições e gerar os horários."
          actions={
            <Button onClick={() => abrirSheet()}>
              <Plus />
              Registar turma
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-surface-lowest">
          <TableCaption
            title="Turmas registadas"
            aside={`Ordem: classe asc • Total exibido: ${paginacao.pageItems.length}`}
          />
          <div className="px-3">
            <TurmasTable
              turmas={paginacao.pageItems}
              empty={mensagemVazia}
              onEditar={abrirSheet}
              onEliminar={setAEliminar}
            />
          </div>
          <div className="border-t px-5 py-3">
            <PaginationBar
              summary={`Página ${paginacao.page} de ${paginacao.pageCount} • Registos: ${de}-${ate} de ${paginacao.total}`}
              page={paginacao.page}
              pageCount={paginacao.pageCount}
              onPrev={paginacao.prev}
              onNext={paginacao.next}
            />
          </div>
        </div>
      )}

      <TurmaSheet
        key={chave}
        open={sheetAberto}
        onOpenChange={setSheetAberto}
        turma={editando}
        cursosSugeridos={cursos}
        areasSugeridas={areas}
      />

      <ConfirmDialog
        open={aEliminar !== null}
        onOpenChange={(aberto) => !aberto && setAEliminar(null)}
        title="Eliminar turma"
        description={`Eliminar ${aEliminar ? rotuloTurma(aEliminar) : 'esta turma'}? As atribuições de disciplinas e professores dela também serão eliminadas. Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!aEliminar) return
          eliminar.mutate(aEliminar.id, {
            onSuccess: () => toast.success('Turma eliminada'),
            onError: (err) => toast.error(err.message),
          })
        }}
      />
    </div>
  )
}