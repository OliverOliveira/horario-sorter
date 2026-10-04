import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { atualizarTurma, criarTurma, eliminarTurma, listarTurmas } from './api'
import type { TurmaInput } from './types'

const KEY = ['turmas']

export function useTurmas() {
  return useQuery({ queryKey: KEY, queryFn: listarTurmas })
}

export function useGuardarTurma() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id?: number; dados: TurmaInput }) =>
      id ? atualizarTurma(id, dados) : criarTurma(dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useEliminarTurma() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: eliminarTurma,
    // Eliminar a turma elimina também as atribuições dela
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['atribuicoes'] })
    },
  })
}