import { api } from '@/lib/api-client';
import type {
  Candidato,
  Incompatibilidades,
  LinhaMatriz,
  LinhaServidor,
  MatrizServidor,
  TurmaOpcao,
} from './matriz.types';

export const listarTurmasOpcoes = () => api.get<TurmaOpcao[]>('/turmas');
export const listarCandidatos = () => api.get<Candidato[]>('/atribuicoes/candidatos');
export const listarTodasAtribuicoes = () => api.get<LinhaServidor[]>('/atribuicoes');
export const obterMatriz = (turmaId: number) => api.get<MatrizServidor>(`/atribuicoes/turma/${turmaId}`);
export const verificarIncompatibilidades = () =>
  api.get<Incompatibilidades>('/atribuicoes/incompatibilidades');
export const gravarMatriz = (turmaId: number, atribuicoes: LinhaMatriz[]) =>
  api.put<MatrizServidor>(`/atribuicoes/turma/${turmaId}`, { atribuicoes });