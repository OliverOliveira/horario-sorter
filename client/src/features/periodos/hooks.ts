import { useQuery } from '@tanstack/react-query'
import { listarPeriodos } from './api'

export function usePeriodos() {
  return useQuery({ queryKey: ['periodos'], queryFn: listarPeriodos })
}