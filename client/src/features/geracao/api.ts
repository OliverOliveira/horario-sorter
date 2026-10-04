import { api } from '@/lib/api-client';
import type {
  ParametrosGeracao,
  ResultadoGeracao,
  TurmaElegivel,
  VersaoDetalhe,
  VersaoResumo,
} from './types';

export const listarTurmasElegiveis = () => api.get<TurmaElegivel[]>('/horarios/elegiveis');
export const gerarHorario = (p: ParametrosGeracao) => api.post<ResultadoGeracao>('/horarios/gerar', p);
export const listarVersoes = () => api.get<VersaoResumo[]>('/horarios/versoes');
export const obterVersao = (id: number) => api.get<VersaoDetalhe>(`/horarios/versoes/${id}`);
export const apagarVersao = (id: number) => api.delete(`/horarios/versoes/${id}`);