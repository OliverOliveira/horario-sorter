import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apagarVersao, gerarHorario, listarTurmasElegiveis, listarVersoes } from './api';
import type { ParametrosGeracao } from './types';

export const useTurmasElegiveis = () =>
  useQuery({ queryKey: ['horarios', 'elegiveis'], queryFn: listarTurmasElegiveis });

export const useVersoes = (ativo: boolean) =>
  useQuery({ queryKey: ['horarios', 'versoes'], queryFn: listarVersoes, enabled: ativo });

export function useGerarHorario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: ParametrosGeracao) => gerarHorario(p),
    onSuccess: (r) => {
      if (r.versao_id !== null) qc.invalidateQueries({ queryKey: ['horarios', 'versoes'] });
    },
  });
}

export function useApagarVersao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apagarVersao(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['horarios', 'versoes'] }),
  });
}