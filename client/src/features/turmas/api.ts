import { api } from '@/lib/api-client'
import type { Turma, TurmaInput } from './types'

export const listarTurmas = () => api.get<Turma[]>('/turmas')
export const criarTurma = (dados: TurmaInput) => api.post<Turma>('/turmas', dados)
export const atualizarTurma = (id: number, dados: TurmaInput) => api.put<Turma>(`/turmas/${id}`, dados)
export const eliminarTurma = (id: number) => api.delete(`/turmas/${id}`)