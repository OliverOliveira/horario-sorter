import { api } from '@/lib/api-client';
import type { PeriodoConfig, Rascunho } from './config.types';

export const listarPeriodosConfig = () => api.get<PeriodoConfig[]>('/periodos');

export const gravarPeriodo = (id: number, dados: Rascunho) =>
  api.put<PeriodoConfig>(`/periodos/${id}`, dados);