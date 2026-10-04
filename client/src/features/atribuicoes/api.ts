// api.ts
import { api } from '@/lib/api-client'
import type { AtribuicaoResumo } from './types'

export const listarAtribuicoesDoProfessor = (professorId: number) =>
  api.get<AtribuicaoResumo[]>(`/atribuicoes?professor_id=${professorId}`)
