export type Disciplina = { id: number; nome: string; sigla: string | null }

export type DisciplinaDetalhe = Disciplina & {
  area_curricular: string | null
  carga_semanal: number
  total_professores: number
}

export type DisciplinaInput = {
  nome: string
  sigla: string | null
  area_curricular: string | null
  carga_semanal: number
}