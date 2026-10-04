// api.ts
import { api } from '@/lib/api-client'
import type { Professor, ProfessorInput } from './types'

export const listarProfessores = () => api.get<Professor[]>('/professores')
export const criarProfessor = (dados: ProfessorInput) => api.post<Professor>('/professores', dados)
export const atualizarProfessor = (id: number, dados: ProfessorInput) =>
  api.put<Professor>(`/professores/${id}`, dados)
export const eliminarProfessor = (id: number) => api.delete(`/professores/${id}`)