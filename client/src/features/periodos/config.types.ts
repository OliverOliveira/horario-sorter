export interface TempoConfig {
  numero: number;
  hora_inicio: string;
  hora_fim: string;
}

export interface PeriodoConfig {
  id: number;
  nome: string;
  intervalo_apos_tempo: number;
  tempos: TempoConfig[];
}

/** Estado editável de um período (sempre 6 tempos; horas vazias = por preencher) */
export interface Rascunho {
  intervalo_apos_tempo: number;
  tempos: TempoConfig[];
}

export type EstadoTempo = 'ok' | 'incompleto' | 'invalido' | 'conflito';

export interface AnaliseTempo {
  numero: number;
  estado: EstadoTempo;
  duracao: number | null; // minutos
  mensagem: string | null;
}