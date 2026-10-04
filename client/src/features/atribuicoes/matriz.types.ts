export interface TurmaMatriz {
  id: number;
  nome: string;
  classe: string;
  curso: string;
  sala: string | null;
  alunos: number | null;
  periodo_id: number;
  periodo: string;
  capacidade: number;
}

export interface LinhaServidor {
  id: number;
  tempos_semana: number;
  turma_id: number;
  turma: string;
  disciplina_id: number;
  disciplina: string;
  sigla: string | null;
  area_curricular: string | null;
  professor_id: number | null;
  professor: string | null;
}

export interface DisciplinaLite {
  id: number;
  nome: string;
  sigla: string | null;
  area_curricular: string | null;
  carga_semanal: number;
}

export interface MatrizServidor {
  turma: TurmaMatriz;
  linhas: LinhaServidor[];
  disciplinas: DisciplinaLite[];
}

/** Linha editável (rascunho) */
export interface LinhaMatriz {
  disciplina_id: number;
  professor_id: number | null;
  tempos_semana: number;
}

export interface Candidato {
  disciplina_id: number;
  professor_id: number;
  nome: string;
  prioridade: number;
  dias: number[];
}

export interface TurmaOpcao {
  id: number;
  nome: string;
  classe: string;
  curso: string;
}

export interface Incompatibilidades {
  turmas: { id: number; nome: string; total: number; capacidade: number }[];
  professores: { id: number; nome: string; periodo: string; total: number; capacidade: number }[];
}