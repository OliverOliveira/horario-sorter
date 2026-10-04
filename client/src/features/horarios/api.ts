import { api } from '@/lib/api-client';
import type { VersaoDetalhe } from '@/features/geracao/types';

export interface PosicaoTempo {
  dia: number;
  tempo: number;
}

export const moverAula = (versaoId: number, turmaId: number, de: PosicaoTempo, para: PosicaoTempo) =>
  api.put<VersaoDetalhe>(`/horarios/versoes/${versaoId}/mover`, { turma_id: turmaId, de, para });

export const publicarVersao = (versaoId: number) =>
  api.put<VersaoDetalhe>(`/horarios/versoes/${versaoId}/publicar`, {});