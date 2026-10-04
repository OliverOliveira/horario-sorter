// hooks.ts
import { useQuery } from '@tanstack/react-query'
import { listarAtribuicoesDoProfessor } from './api'

export function useAtribuicoesDoProfessor(professorId?: number) {
  return useQuery({
    queryKey: ['atribuicoes', 'professor', professorId],
    queryFn: () => listarAtribuicoesDoProfessor(professorId!),
    enabled: professorId !== undefined,
  })
}