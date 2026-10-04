import { CircleHelp, Plus, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { PaginationBar } from '@/components/shared/pagination-bar'
import { SearchInput } from '@/components/shared/search-input'
import { SummaryBar } from '@/components/shared/summary-bar'
import { usePagination } from '@/hooks/use-pagination'
import { ANO_LECTIVO } from '@/lib/constants'
import { ProfessoresTable } from '../components/professores-table'
import { ProfessorSheet } from '../components/professor-sheet'
import { useEliminarProfessor, useProfessores } from '../hooks'
import type { Professor } from '../types'
import { estadoProfessor } from '../utils'

const PAGE_SIZE = 7

export function ProfessoresPage() {
  const { data: professores = [], isLoading, isError, error } = useProfessores()
  const eliminar = useEliminarProfessor()

  const [busca, setBusca] = useState('')
  const [sheetAberto, setSheetAberto] = useState(false)
  const [editando, setEditando] = useState<Professor | undefined>()
  const [aEliminar, setAEliminar] = useState<Professor | null>(null)

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return professores
    return professores.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        p.disciplinas.some((d) => d.nome.toLowerCase().includes(termo)),
    )
  }, [professores, busca])

  const paginacao = usePagination(filtrados, PAGE_SIZE)
  const pendentes = professores.filter((p) => estadoProfessor(p) === 'pendente').length
  const de = paginacao.total === 0 ? 0 : (paginacao.page - 1) * PAGE_SIZE + 1
  const ate = de + paginacao.pageItems.length - (paginacao.total === 0 ? 0 : 1)

  const mensagemVazia = isLoading
    ? 'A carregar professores…'
    : isError
      ? `Não foi possível carregar: ${error.message}`
      : busca
        ? 'Nenhum professor encontrado.'
        : 'Ainda não há professores. Clique em "Novo professor".'

  function abrirNovo() {
    setEditando(undefined)
    setSheetAberto(true)
  }

  function abrirEdicao(professor: Professor) {
    setEditando(professor)
    setSheetAberto(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Corpo docente"
        title="Professores"
        description={`Gestão do corpo docente, preferências de dias letivos e critérios de desempate de alocação ${ANO_LECTIVO}.`}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              className="w-72"
              placeholder="Filtrar por nome ou disciplina…"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value)
                paginacao.reset()
              }}
            />
            <Button variant="outline">
              <SlidersHorizontal />
              Filtros
            </Button>
            <Button onClick={abrirNovo}>
              <Plus />
              Novo professor
            </Button>
          </div>
        }
      />

      <div className="overflow-hidden rounded-lg border bg-surface-lowest">
        <SummaryBar
          items={[
            { value: professores.length, label: 'professores registados' },
            { value: professores.length - pendentes, label: 'com disponibilidade' },
            { value: pendentes, label: 'pendentes' },
          ]}
          aside={
            <span
              title="Em caso de conflito no mesmo dia, vence o professor com maior prioridade (P5)."
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
            >
              Alocação conflito: resolução P1-P5
              <CircleHelp className="size-4" />
            </span>
          }
        />

        <div className="px-3">
          <ProfessoresTable
            professores={paginacao.pageItems}
            empty={mensagemVazia}
            onEditar={abrirEdicao}
            onEliminar={setAEliminar}
          />
        </div>

        <div className="border-t px-5 py-3">
          <PaginationBar
            summary={
              <>
                A mostrar{' '}
                <span className="font-medium text-foreground">
                  {de}–{ate}
                </span>{' '}
                de <span className="font-medium text-foreground">{paginacao.total}</span> professores
              </>
            }
            page={paginacao.page}
            pageCount={paginacao.pageCount}
            onPrev={paginacao.prev}
            onNext={paginacao.next}
          />
        </div>
      </div>

      <ProfessorSheet open={sheetAberto} onOpenChange={setSheetAberto} professor={editando} />

      <ConfirmDialog
        open={aEliminar !== null}
        onOpenChange={(aberto) => !aberto && setAEliminar(null)}
        title="Eliminar professor"
        description={`Tem a certeza de que deseja eliminar ${aEliminar?.nome ?? 'este professor'}? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!aEliminar) return
          eliminar.mutate(aEliminar.id, {
            onSuccess: () => toast.success('Professor eliminado'),
            onError: (err) => toast.error(err.message),
          })
        }}
      />
    </div>
  )
}