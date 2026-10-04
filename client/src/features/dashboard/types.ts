import type { StatusVariant } from '@/components/shared/status-tag'

export type PeriodoResumo = {
  nome: 'Manhã' | 'Tarde'
  horario: string
  totalTurmas: number
  percentual: number
  composicao: string
}

export type Pendencia = {
  id: string
  variant: 'pendente' | 'conflito'
  titulo: string
  detalhe: string
  acao: string
  to: string
}

export type HorarioGerado = {
  id: number
  periodo: string
  intervalo: string
  turmas: string
  dataHora: string
  conflitos: string
  estado: StatusVariant
}