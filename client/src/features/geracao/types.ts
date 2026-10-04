export interface TurmaElegivel {
  id: number;
  nome: string;
  classe: string;
  curso: string;
  sala: string | null;
  periodo_id: number;
  disciplinas: number;
  tempos_total: number;
  tempos_com_professor: number;
  capacidade: number;
}

export interface AulaGerada {
  turma_id: number;
  disciplina_id: number;
  professor_id: number;
  dia: number;
  tempo: number;
}

export interface Metricas {
  seed: number;
  iteracoes: number;
  iteracoes_pedidas: number;
  custo: number;
  tempo_ms: number;
  total_aulas: number;
  colocadas: number;
  janelas_professores: number;
  janelas_turmas: number;
  fora_dias_preferenciais: number;
}

export interface Referencias {
  intervalo_apos_tempo: number;
  tempos: { numero: number; hora_inicio: string; hora_fim: string }[];
  turmas: Record<number, { nome: string; classe: string; curso: string; sala: string | null }>;
  disciplinas: Record<number, { nome: string; sigla: string | null }>;
  professores: Record<number, string>;
}

export interface ResultadoGeracao {
  versao_id: number | null;
  aulas: AulaGerada[];
  nao_colocadas: { turma_id: number; disciplina_id: number; professor_id: number; em_falta: number }[];
  ignoradas: { turma_id: number; disciplina_id: number; tempos: number }[];
  metricas: Metricas;
  referencias: Referencias;
}

export interface ParametrosGeracao {
  periodo_id: number;
  turma_ids: number[];
  gravar: boolean;
  iteracoes: number;
  limite_s: number;
  peso_janelas: number;
  seed?: number;
}

export interface VersaoResumo {
  id: number;
  periodo_id: number;
  periodo: string;
  estado: string;
  seed: number;
  custo: number;
  criado_em: string;
  turmas: number;
  aulas: number;
}

export interface VersaoDetalhe {
  versao: VersaoResumo & { metricas: Metricas };
  aulas: AulaGerada[];
  referencias: Referencias;
}