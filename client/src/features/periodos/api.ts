import { api } from '@/lib/api-client'
import type { Periodo } from './types'

export const listarPeriodos = () => api.get<Periodo[]>('/periodos')