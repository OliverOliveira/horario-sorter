// hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { atualizarProfessor, criarProfessor, eliminarProfessor, listarProfessores } from './api'
import type { ProfessorInput } from './types'

const KEY = ['professores']

export function useProfessores() {
  return useQuery({ queryKey: KEY, queryFn: listarProfessores })
}

export function useGuardarProfessor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id?: number; dados: ProfessorInput }) =>
      id ? atualizarProfessor(id, dados) : criarProfessor(dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useEliminarProfessor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: eliminarProfessor,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}