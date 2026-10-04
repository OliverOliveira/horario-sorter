import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { atualizarDisciplina, criarDisciplina, eliminarDisciplina, listarDisciplinas } from './api'
import type { DisciplinaInput } from './types'

const KEY = ['disciplinas']

export function useDisciplinas() {
  return useQuery({ queryKey: KEY, queryFn: listarDisciplinas })
}

// Ao mudar disciplinas, a lista de professores (que mostra os nomes) também fica desatualizada
function useInvalidar() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: KEY })
    qc.invalidateQueries({ queryKey: ['professores'] })
  }
}

export function useGuardarDisciplina() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, dados }: { id?: number; dados: DisciplinaInput }) =>
      id ? atualizarDisciplina(id, dados) : criarDisciplina(dados),
    onSuccess: invalidar,
  })
}

export function useEliminarDisciplina() {
  const invalidar = useInvalidar()
  return useMutation({ mutationFn: eliminarDisciplina, onSuccess: invalidar })
}