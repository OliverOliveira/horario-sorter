import type { ResultadoGeracao } from './types';

export const DIAS_ABREV = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

export const rotuloTurma = (t: { classe: string; curso: string; nome: string }) =>
  `${t.classe}ª ${t.curso} ${t.nome}`;

export function formatarData(s: string): string {
  const d = new Date(s.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
}

/** Matriz completa (uma linha por aula), separador ";" para o Excel */
export function csvMatriz(r: ResultadoGeracao): string {
  const ref = r.referencias;
  const linhas = [...r.aulas]
    .sort((a, b) => a.turma_id - b.turma_id || a.dia - b.dia || a.tempo - b.tempo)
    .map((a) => {
      const t = ref.tempos.find((x) => x.numero === a.tempo);
      const turma = ref.turmas[a.turma_id];
      return [
        turma ? rotuloTurma(turma) : String(a.turma_id),
        DIAS_ABREV[a.dia - 1],
        `T${a.tempo}`,
        t?.hora_inicio ?? '',
        t?.hora_fim ?? '',
        ref.disciplinas[a.disciplina_id]?.nome ?? '',
        ref.professores[a.professor_id] ?? '',
      ];
    });
  const cab = ['Turma', 'Dia', 'Tempo', 'Início', 'Fim', 'Disciplina', 'Professor'];
  return [cab, ...linhas].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
}