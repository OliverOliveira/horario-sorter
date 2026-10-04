export type Turma = {
  id: number
  nome: string
  classe: string
  curso: string
  area_formacao: string | null
  sala: string | null
  alunos: number | null
  periodo_id: number
  periodo: string
}

export type TurmaInput = {
  nome: string
  classe: string
  curso: string
  area_formacao: string | null
  sala: string | null
  alunos: number | null
  periodo_id: number
}