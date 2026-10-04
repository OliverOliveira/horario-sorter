// types.ts
import type { Disciplina } from '@/features/disciplinas/types'

export type Professor = {
  id: number
  nome: string
  email: string | null
  prioridade: number
  disciplinas: Disciplina[]
  dias_preferenciais: number[]
}

export type ProfessorInput = {
  nome: string
  email: string | null
  prioridade: number
  disciplina_ids: number[]
  dias_preferenciais: number[]
}