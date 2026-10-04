import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/form-field'
import { FormSheet } from '@/components/shared/form-sheet'
import { NumberStepper } from '@/components/shared/number-stepper'
import { SectionLabel } from '@/components/shared/section-label'
import { useGuardarDisciplina } from '../hooks'
import type { DisciplinaDetalhe } from '../types'

type DisciplinaSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  disciplina?: DisciplinaDetalhe
  areasSugeridas: string[]
}

// Use a prop `key` na página para recomeçar o formulário a cada abertura
export function DisciplinaSheet({ open, onOpenChange, disciplina, areasSugeridas }: DisciplinaSheetProps) {
  const guardar = useGuardarDisciplina()

  const [nome, setNome] = useState(disciplina?.nome ?? '')
  const [sigla, setSigla] = useState(disciplina?.sigla ?? '')
  const [area, setArea] = useState(disciplina?.area_curricular ?? '')
  const [carga, setCarga] = useState(disciplina?.carga_semanal ?? 2)
  const [tentouGuardar, setTentouGuardar] = useState(false)

  const erroNome = tentouGuardar && !nome.trim() ? 'Informe o nome da disciplina' : null

  function submeter() {
    setTentouGuardar(true)
    if (!nome.trim()) return

    guardar.mutate(
      {
        id: disciplina?.id,
        dados: {
          nome: nome.trim(),
          sigla: sigla.trim().toUpperCase() || null,
          area_curricular: area.trim() || null,
          carga_semanal: carga,
        },
      },
      {
        onSuccess: () => {
          toast.success(disciplina ? 'Disciplina atualizada' : 'Disciplina registada')
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
      title={disciplina ? 'Editar Disciplina' : 'Nova Disciplina'}
      description={
        disciplina ? 'Atualizar dados da componente curricular' : 'Cadastrar componente curricular'
      }
      submitLabel="Guardar disciplina"
      submitting={guardar.isPending}
      onSubmit={submeter}
    >
      <FormField
        label="Nome da disciplina"
        htmlFor="disciplina-nome"
        aside={<SectionLabel className="opacity-70">Obrigatório</SectionLabel>}
        error={erroNome}
      >
        <Input
          id="disciplina-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Matemática"
          aria-invalid={!!erroNome}
          autoFocus
        />
      </FormField>

      <FormField
        label="Sigla"
        htmlFor="disciplina-sigla"
        aside={<SectionLabel className="opacity-70">Opcional</SectionLabel>}
      >
        <Input
          id="disciplina-sigla"
          value={sigla}
          onChange={(e) => setSigla(e.target.value.toUpperCase())}
          placeholder="Ex.: MAT"
          maxLength={8}
        />
      </FormField>

      <FormField
        label="Área curricular"
        htmlFor="disciplina-area"
        aside={<SectionLabel className="opacity-70">Opcional</SectionLabel>}
        hint="Escolha uma área já usada ou escreva uma nova."
      >
        <Input
          id="disciplina-area"
          list="areas-curriculares"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Ex.: Científica Geral"
        />
        <datalist id="areas-curriculares">
          {areasSugeridas.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </FormField>

      <FormField
        label="Carga semanal"
        aside={
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
            {carga} {carga === 1 ? 'tempo' : 'tempos'}
          </span>
        }
        hint="Número de tempos letivos desta disciplina por semana."
      >
        <NumberStepper value={carga} min={1} max={20} onChange={setCarga} />
      </FormField>
    </FormSheet>
  )
}