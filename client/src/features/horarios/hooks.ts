import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { obterVersao } from '@/features/geracao/api';
import { moverAula, publicarVersao, type PosicaoTempo } from './api';

export const useVersaoDetalhe = (id: number | null) =>
  useQuery({
    queryKey: ['horarios', 'versao', id],
    queryFn: () => obterVersao(id as number),
    enabled: id !== null,
  });

export function useMoverAula(versaoId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { turmaId: number; de: PosicaoTempo; para: PosicaoTempo }) =>
      moverAula(versaoId as number, p.turmaId, p.de, p.para),
    onSuccess: (d) => qc.setQueryData(['horarios', 'versao', versaoId], d),
  });
}

export function usePublicarVersao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => publicarVersao(id),
    onSuccess: (d) => {
      qc.setQueryData(['horarios', 'versao', d.versao.id], d);
      qc.invalidateQueries({ queryKey: ['horarios', 'versoes'] });
    },
  });
}