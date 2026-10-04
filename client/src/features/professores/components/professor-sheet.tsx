import { Check } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DayToggle } from '@/components/shared/day-chips'
import { FormField } from '@/components/shared/form-field'
import { NumberStepper } from '@/components/shared/number-stepper'
import { PrioritySegments } from '@/components/shared/priority-segments'
import { SectionLabel } from '@/components/shared/section-label'
import { Tag } from '@/components/shared/tag'
import { TagMultiSelect } from '@/components/shared/tag-multi-select'
import { useAtribuicoesDoProfessor } from '@/features/atribuicoes/hooks'
import { useDisciplinas } from '@/features/disciplinas/hooks'
import { PRIORIDADE_MAX, PRIORIDADE_MIN } from '@/lib/constants'
import { useGuardarProfessor } from '../hooks'
import type { Professor } from '../types'
import { codigoProfessor } from '../utils'

type ProfessorSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  professor?: Professor
}

export function ProfessorSheet({ open, onOpenChange, professor }: ProfessorSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {/* O formulário vive dentro do conteúdo: ao fechar, o estado é descartado */}
        <ProfessorForm
          key={professor?.id ?? 'novo'}
          professor={professor}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

function ProfessorForm({ professor, onClose }: { professor?: Professor; onClose: () => void }) {
  const { data: disciplinas = [] } = useDisciplinas()
  const { data: atribuicoes = [] } = useAtribuicoesDoProfessor(professor?.id)
  const guardar = useGuardarProfessor()

  const [nome, setNome] = useState(professor?.nome ?? '')
  const [email, setEmail] = useState(professor?.email ?? '')
  const [prioridade, setPrioridade] = useState(
    Math.min(Math.max(professor?.prioridade ?? 3, PRIORIDADE_MIN), PRIORIDADE_MAX),
  )
  const [disciplinaIds, setDisciplinaIds] = useState<number[]>(
    professor?.disciplinas.map((d) => d.id) ?? [],
  )
  const [dias, setDias] = useState<number[]>(professor?.dias_preferenciais ?? [])
  const [tentouGuardar, setTentouGuardar] = useState(false)

  const erroNome = tentouGuardar && !nome.trim() ? 'Informe o nome completo' : null
  const totalTempos = atribuicoes.reduce((soma, a) => soma + a.tempos_semana, 0)
  const totalTurmas = new Set(atribuicoes.map((a) => a.turma_id)).size

  function submeter(e: FormEvent) {
    e.preventDefault()
    setTentouGuardar(true)
    if (!nome.trim()) return

    guardar.mutate(
      {
        id: professor?.id,
        dados: {
          nome: nome.trim(),
          email: email.trim() || null,
          prioridade,
          disciplina_ids: disciplinaIds,
          dias_preferenciais: dias,
        },
      },
      {
        onSuccess: () => {
          toast.success(professor ? 'Professor atualizado' : 'Professor registado')
          onClose()
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <>
      <SheetHeader className="space-y-1 border-b px-6 py-4 pr-12 text-left">
        <div className="flex items-center gap-2">
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {professor ? 'Editar Professor' : 'Novo Professor'}
          </SheetTitle>
          <Tag mono>{professor ? codigoProfessor(professor.id) : 'DOC-NEW'}</Tag>
        </div>
        <SheetDescription>
          {professor
            ? 'Atualizar dados e critérios de precedência'
            : 'Cadastrar docente e definir critérios de precedência'}
        </SheetDescription>
      </SheetHeader>

      <form onSubmit={submeter} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <FormField
            label="Nome completo"
            htmlFor="professor-nome"
            aside={<SectionLabel className="opacity-70">Obrigatório</SectionLabel>}
            error={erroNome}
          >
            <Input
              id="professor-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Manuel António da Silva"
              aria-invalid={!!erroNome}
              autoFocus
            />
          </FormField>

          <FormField
            label="E-mail"
            htmlFor="professor-email"
            aside={<SectionLabel className="opacity-70">Opcional</SectionLabel>}
          >
            <Input
              id="professor-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@ipp-osvalda.ao"
            />
          </FormField>

          <FormField
            label="Prioridade no desempate"
            aside={
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                Nível P{prioridade}
              </span>
            }
            hint="Maior número vence quando dois professores querem o mesmo dia."
          >
            <div className="flex items-center gap-4 rounded-[4px] border bg-background p-2">
              <NumberStepper
                value={prioridade}
                min={PRIORIDADE_MIN}
                max={PRIORIDADE_MAX}
                onChange={setPrioridade}
              />
              <PrioritySegments value={prioridade} size="md" />
            </div>
          </FormField>

          <FormField
            label="Disciplinas"
            aside={
              <SectionLabel className="opacity-70">
                {disciplinaIds.length} {disciplinaIds.length === 1 ? 'selecionada' : 'selecionadas'}
              </SectionLabel>
            }
          >
            <TagMultiSelect
              options={disciplinas.map((d) => ({ id: d.id, label: d.nome }))}
              value={disciplinaIds}
              onChange={setDisciplinaIds}
              addLabel="Adicionar disciplina"
              emptyLabel="Cadastre disciplinas primeiro"
            />
          </FormField>

          <FormField
            label="Dias preferenciais"
            hint="Dias da semana em que o docente prefere lecionar."
          >
            <DayToggle value={dias} onChange={setDias} />
          </FormField>

          <div className="border-t border-dashed pt-6">
            <FormField label="Carga horária semanal">
              <div className="flex items-center justify-between rounded-[4px] border bg-background px-3 py-2 text-sm">
                {professor ? (
                  <>
                    <span>{totalTempos} tempos / semana</span>
                    <span className="text-muted-foreground">
                      {totalTurmas} {totalTurmas === 1 ? 'turma' : 'turmas'}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Calculada a partir das atribuições</span>
                )}
              </div>
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardar.isPending}>
            <Check />
            Guardar professor
          </Button>
        </div>
      </form>
    </>
  )
}