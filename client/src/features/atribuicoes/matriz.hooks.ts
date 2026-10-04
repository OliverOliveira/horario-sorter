import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  gravarMatriz,
  listarCandidatos,
  listarTodasAtribuicoes,
  listarTurmasOpcoes,
  obterMatriz,
  verificarIncompatibilidades,
} from './matriz.api';
import type { LinhaMatriz } from './matriz.types';

export const useTurmasOpcoes = () =>
  useQuery({ queryKey: ['turmas', 'opcoes'], queryFn: listarTurmasOpcoes });

export const useCandidatos = () =>
  useQuery({ queryKey: ['atribuicoes', 'candidatos'], queryFn: listarCandidatos });

export const useTodasAtribuicoes = () =>
  useQuery({ queryKey: ['atribuicoes', 'todas'], queryFn: listarTodasAtribuicoes });

export const useMatriz = (turmaId: number | null) =>
  useQuery({
    queryKey: ['atribuicoes', 'turma', turmaId],
    queryFn: () => obterMatriz(turmaId as number),
    enabled: turmaId !== null,
  });

export const useIncompatibilidades = () =>
  useQuery({
    queryKey: ['atribuicoes', 'incompatibilidades'],
    queryFn: verificarIncompatibilidades,
    enabled: false, // só corre quando o utilizador clica em "Verificar"
  });

export function useGravarMatriz(turmaId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linhas: LinhaMatriz[]) => gravarMatriz(turmaId as number, linhas),
    onSuccess: (dados) => {
      qc.setQueryData(['atribuicoes', 'turma', turmaId], dados);
      // atualiza listas globais e a carga horária mostrada no sheet de professores
      qc.invalidateQueries({ queryKey: ['atribuicoes'] });
    },
  });
}