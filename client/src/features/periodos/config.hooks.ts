import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gravarPeriodo, listarPeriodosConfig } from './config.api';
import type { Rascunho } from './config.types';

export const usePeriodosConfig = () =>
  useQuery({ queryKey: ['periodos', 'config'], queryFn: listarPeriodosConfig });

export function useGravarPeriodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: Rascunho }) => gravarPeriodo(id, dados),
    onSuccess: () => {
      // invalida também outras listas de períodos usadas noutras telas
      qc.invalidateQueries({ queryKey: ['periodos'] });
      qc.invalidateQueries({ queryKey: ['atribuicoes'] }); // a capacidade das turmas depende dos tempos
    },
  });
}