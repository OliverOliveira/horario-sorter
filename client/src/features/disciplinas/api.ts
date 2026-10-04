import { api } from '@/lib/api-client'
import type { DisciplinaDetalhe, DisciplinaInput } from './types'

export const listarDisciplinas = () => api.get<DisciplinaDetalhe[]>('/disciplinas')
export const criarDisciplina = (dados: DisciplinaInput) =>
  api.post<DisciplinaDetalhe>('/disciplinas', dados)
export const atualizarDisciplina = (id: number, dados: DisciplinaInput) =>
  api.put<DisciplinaDetalhe>(`/disciplinas/${id}`, dados)
export const eliminarDisciplina = (id: number) => api.delete(`/disciplinas/${id}`)