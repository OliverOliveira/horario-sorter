import { DoorOpen, Info, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ComboInput } from '@/components/shared/combo-input'
import { FormField } from '@/components/shared/form-field'
import { FormSheet } from '@/components/shared/form-sheet'
import { IconInput } from '@/components/shared/icon-input'
import { Input } from '@/components/ui/input'
import { OptionCards } from '@/components/shared/option-cards'
import { SectionLabel } from '@/components/shared/section-label'
import { SegmentedControl } from '@/components/shared/segmented-control'
import { usePeriodos } from '@/features/periodos/hooks'
import { faixaHoraria } from '@/features/periodos/utils'
import { CLASSES } from '@/lib/constants'
import { useGuardarTurma } from '../hooks'
import type { Turma } from '../types'
import { codigoTurma } from '../utils'

type TurmaSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  turma?: Turma
  cursosSugeridos: string[]
  areasSugeridas: string[]
}

const obrigatorio = <SectionLabel className="opacity-70">Obrigatório</SectionLabel>

// Use `key` na página para recomeçar o formulário a cada abertura
export function TurmaSheet({ open, onOpenChange, turma, cursosSugeridos, areasSugeridas }: TurmaSheetProps) {
  const { data: periodos = [] } = usePeriodos()
  const guardar = useGuardarTurma()

  const [nome, setNome] = useState(turma?.nome ?? '')
  const [classe, setClasse] = useState<string>(turma?.classe ?? CLASSES[0])
  const [curso, setCurso] = useState(turma?.curso ?? '')
  const [area, setArea] = useState(turma?.area_formacao ?? '')
  const [sala, setSala] = useState(turma?.sala ?? '')
  const [periodoId, setPeriodoId] = useState<number | undefined>(turma?.periodo_id)
  const [alunos, setAlunos] = useState(turma?.alunos?.toString() ?? '')
  const [tentouGuardar, setTentouGuardar] = useState(false)

  // Enquanto o utilizador não escolhe, assume o primeiro período da lista
  const periodoEfetivo = periodoId ?? periodos[0]?.id
  const alunosNum = alunos.trim() === '' ? null : Number(alunos)

  const erros = {
    nome: nome.trim() ? null : 'Informe a identificação da turma',
    curso: curso.trim() ? null : 'Informe o curso',
    periodo: periodoEfetivo === undefined ? 'Selecione o período' : null,
    alunos:
      alunosNum !== null && (!Number.isInteger(alunosNum) || alunosNum < 1 || alunosNum > 500)
        ? 'Use um número inteiro entre 1 e 500'
        : null,
  }
  const valido = Object.values(erros).every((e) => e === null)
  const mostrar = (erro: string | null) => (tentouGuardar ? erro : null)

  function submeter() {
    setTentouGuardar(true)
    if (!valido || periodoEfetivo === undefined) return

    guardar.mutate(
      {
        id: turma?.id,
        dados: {
          nome: nome.trim(),
          classe,
          curso: curso.trim(),
          area_formacao: area.trim() || null,
          sala: sala.trim() || null,
          alunos: alunosNum,
          periodo_id: periodoEfetivo,
        },
      },
      {
        onSuccess: () => {
          toast.success(turma ? 'Turma atualizada' : 'Turma registada')
          onOpenChange(false)
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={turma ? 'Editar Turma' : 'Nova Turma'}
      code={turma ? codigoTurma(turma.id) : 'TURMA-REG'}
      description="Registar turma e associar ao período e sala."
      submitLabel="Guardar turma"
      submitting={guardar.isPending}
      onSubmit={submeter}
    >
      <FormField
        label="Identificação da turma"
        htmlFor="turma-nome"
        aside={obrigatorio}
        hint="Letra ou nome curto da turma (aparece no cabeçalho do horário)."
        error={mostrar(erros.nome)}
      >
        <Input
          id="turma-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: A"
          maxLength={20}
          aria-invalid={!!mostrar(erros.nome)}
          autoFocus
        />
      </FormField>

      <FormField label="Classe escolar" aside={obrigatorio}>
        <SegmentedControl
          fill
          ariaLabel="Classe escolar"
          value={classe}
          onChange={setClasse}
          options={CLASSES.map((c) => ({ value: c as string, label: c }))}
        />
      </FormField>

      <FormField
        label="Curso técnico-profissional"
        htmlFor="turma-curso"
        aside={obrigatorio}
        hint="Escolha um curso já registado ou escreva um novo."
        error={mostrar(erros.curso)}
      >
        <ComboInput
          id="turma-curso"
          value={curso}
          onChange={(e) => setCurso(e.target.value)}
          options={cursosSugeridos}
          placeholder="Ex.: Técnico de Informática"
          aria-invalid={!!mostrar(erros.curso)}
        />
      </FormField>

      <FormField label="Área de formação" htmlFor="turma-area">
        <ComboInput
          id="turma-area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          options={areasSugeridas}
          placeholder="Ex.: Informática"
        />
      </FormField>

      <FormField
        label="Sala / espaço pedagógico preferencial"
        htmlFor="turma-sala"
        hint="Espaço fixo da turma (opcional)."
      >
        <IconInput
          id="turma-sala"
          icon={DoorOpen}
          value={sala}
          onChange={(e) => setSala(e.target.value)}
          placeholder="Ex.: Laboratório 02"
        />
      </FormField>

      <FormField label="Turno de ensino (período)" aside={obrigatorio} error={mostrar(erros.periodo)}>
        <OptionCards
          ariaLabel="Turno de ensino"
          value={periodoEfetivo === undefined ? undefined : String(periodoEfetivo)}
          onChange={(v) => setPeriodoId(Number(v))}
          options={periodos.map((p) => ({
            value: String(p.id),
            label: p.nome,
            description: faixaHoraria(p),
          }))}
        />
      </FormField>

      <FormField label="Nº de alunos" htmlFor="turma-alunos" error={mostrar(erros.alunos)}>
        <IconInput
          id="turma-alunos"
          icon={Users}
          inputMode="numeric"
          value={alunos}
          onChange={(e) => setAlunos(e.target.value.replace(/\D/g, ''))}
          placeholder="Ex.: 35"
          aria-invalid={!!mostrar(erros.alunos)}
        />
      </FormField>

      <div className="flex items-start gap-3 rounded-[4px] border bg-background p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        Depois de registar a turma, defina as disciplinas e os professores dela na tela de Atribuições.
      </div>
    </FormSheet>
  )
}