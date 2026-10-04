import { BadgeCheck, Download, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { InfoCard } from '@/components/shared/info-card'
import { MetricGroup } from '@/components/shared/metric-group'
import { NativeSelect } from '@/components/shared/native-select'
import { PaginationBar } from '@/components/shared/pagination-bar'
import { SearchInput } from '@/components/shared/search-input'
import { SectionLabel } from '@/components/shared/section-label'
import { SegmentedControl } from '@/components/shared/segmented-control'
import { SummaryBar } from '@/components/shared/summary-bar'
import { TableCaption } from '@/components/shared/table-caption'
import { Tag } from '@/components/shared/tag'
import { usePagination } from '@/hooks/use-pagination'
import { ANO_LECTIVO } from '@/lib/constants'
import { downloadCsv } from '@/lib/download'
import { DisciplinaSheet } from '../components/disciplina-sheet'
import { DisciplinasTable } from '../components/disciplinas-table'
import { useDisciplinas, useEliminarDisciplina } from '../hooks'
import type { DisciplinaDetalhe } from '../types'
import { estadoDisciplina, normalizar } from '../utils'

const PAGE_SIZE = 7
const TODAS = 'todas'
type FiltroEstado = 'todas' | 'ativo' | 'pendente'

export function DisciplinasPage() {
  const { data: disciplinas = [], isLoading, isError, error } = useDisciplinas()
  const eliminar = useEliminarDisciplina()

  const [busca, setBusca] = useState('')
  const [area, setArea] = useState(TODAS)
  const [estado, setEstado] = useState<FiltroEstado>('todas')
  const [sheetAberto, setSheetAberto] = useState(false)
  const [editando, setEditando] = useState<DisciplinaDetalhe | undefined>()
  const [chave, setChave] = useState(0) // muda a cada abertura para limpar o formulário
  const [aEliminar, setAEliminar] = useState<DisciplinaDetalhe | null>(null)

  const areas = useMemo(
    () =>
      [...new Set(disciplinas.map((d) => d.area_curricular).filter((a): a is string => !!a))].sort(),
    [disciplinas],
  )

  const ativas = disciplinas.filter((d) => estadoDisciplina(d) === 'ativo').length
  const pendentes = disciplinas.length - ativas
  const tecnicas = disciplinas.filter((d) =>
    normalizar(d.area_curricular ?? '').includes('tecnica'),
  ).length
  const cargaTotal = disciplinas.reduce((soma, d) => soma + d.carga_semanal, 0)
  const taxa = disciplinas.length ? (ativas / disciplinas.length) * 100 : 0

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim())
    return disciplinas.filter(
      (d) =>
        (area === TODAS || d.area_curricular === area) &&
        (estado === 'todas' || estadoDisciplina(d) === estado) &&
        (!termo ||
          normalizar(d.nome).includes(termo) ||
          normalizar(d.sigla ?? '').includes(termo)),
    )
  }, [disciplinas, busca, area, estado])

  const paginacao = usePagination(filtradas, PAGE_SIZE)

  const mensagemVazia = isLoading
    ? 'A carregar disciplinas…'
    : isError
      ? `Não foi possível carregar: ${error.message}`
      : disciplinas.length === 0
        ? 'Ainda não há disciplinas. Clique em "Nova disciplina".'
        : 'Nenhuma disciplina encontrada.'

  function abrirSheet(disciplina?: DisciplinaDetalhe) {
    setEditando(disciplina)
    setChave((c) => c + 1)
    setSheetAberto(true)
  }

  function exportarCsv() {
    downloadCsv('disciplinas.csv', [
      ['Disciplina', 'Sigla', 'Área curricular', 'Professores', 'Carga semanal (tempos)', 'Estado'],
      ...filtradas.map((d) => [
        d.nome,
        d.sigla,
        d.area_curricular,
        d.total_professores,
        d.carga_semanal,
        estadoDisciplina(d) === 'ativo' ? 'Ativo' : 'Pendente',
      ]),
    ])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-[4px] bg-surface-lowest px-4 py-2">
        <span className="size-1.5 rounded-full bg-foreground" />
        <SectionLabel>Estrutura curricular • Componentes lectivas</SectionLabel>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Disciplinas</h1>
            <Tag mono>{disciplinas.length} total</Tag>
          </div>
          <SummaryBar
            bare
            items={[
              { value: disciplinas.length, label: 'disciplinas registadas' },
              { value: ativas, label: 'ativas com docentes' },
              { value: tecnicas, label: 'técnicas' },
            ]}
          />
        </div>
        <MetricGroup
          metrics={[
            { label: 'Carga lectiva', value: `${cargaTotal} tempos/sem` },
            { label: 'Taxa alocação', value: `${taxa.toFixed(1)}%` },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <SearchInput
          className="min-w-60 flex-1"
          placeholder="Filtrar por nome ou sigla…"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            paginacao.reset()
          }}
        />
        <NativeSelect
          className="w-52"
          value={area}
          aria-label="Filtrar por área"
          onChange={(e) => {
            setArea(e.target.value)
            paginacao.reset()
          }}
        >
          <option value={TODAS}>Todas as áreas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </NativeSelect>
        <SegmentedControl<FiltroEstado>
          ariaLabel="Filtrar por estado"
          value={estado}
          onChange={(v) => {
            setEstado(v)
            paginacao.reset()
          }}
          options={[
            { value: 'todas', label: `Todas (${disciplinas.length})` },
            { value: 'ativo', label: `Ativas (${ativas})` },
            { value: 'pendente', label: `Pendentes (${pendentes})` },
          ]}
        />
        <Button onClick={() => abrirSheet()}>
          <Plus />
          Nova disciplina
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-surface-lowest">
        <TableCaption
          title="Catálogo de disciplinas"
          tag={`Ano lectivo ${ANO_LECTIVO}`}
          aside={`Mostrando ${paginacao.pageItems.length} de ${paginacao.total} registos`}
        />
        <div className="px-3">
          <DisciplinasTable
            disciplinas={paginacao.pageItems}
            empty={mensagemVazia}
            onEditar={abrirSheet}
            onEliminar={setAEliminar}
          />
        </div>
        <div className="border-t px-5 py-3">
          <PaginationBar
            summary={`Página ${paginacao.page} de ${paginacao.pageCount} • Matriz horária ${ANO_LECTIVO}`}
            page={paginacao.page}
            pageCount={paginacao.pageCount}
            onPrev={paginacao.prev}
            onNext={paginacao.next}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Critério de desempate" icon={BadgeCheck}>
          Quando dois professores têm o mesmo dia preferencial, prevalece o de maior prioridade.
        </InfoCard>
        <InfoCard title="Limites de corpo docente" icon={Users}>
          Disciplinas sem docente alocado permanecem no estado Pendente e não entram na geração do
          horário.
        </InfoCard>
        <InfoCard title="Exportação" icon={Download}>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={exportarCsv}>
              CSV matriz
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled
              title="Disponível numa próxima etapa"
            >
              Relatório PDF
            </Button>
          </div>
        </InfoCard>
      </div>

      <DisciplinaSheet
        key={chave}
        open={sheetAberto}
        onOpenChange={setSheetAberto}
        disciplina={editando}
        areasSugeridas={areas}
      />

      <ConfirmDialog
        open={aEliminar !== null}
        onOpenChange={(aberto) => !aberto && setAEliminar(null)}
        title="Eliminar disciplina"
        description={`Tem a certeza de que deseja eliminar ${aEliminar?.nome ?? 'esta disciplina'}? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!aEliminar) return
          eliminar.mutate(aEliminar.id, {
            onSuccess: () => toast.success('Disciplina eliminada'),
            onError: (err) => toast.error(err.message),
          })
        }}
      />
    </div>
  )
}