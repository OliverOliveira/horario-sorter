import type { LinhaMatriz, LinhaServidor } from './matriz.types';

const ABREV = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

export function descreverDias(dias: number[] | undefined): string {
  if (!dias) return '—';
  if (dias.length === 0) return 'Qualquer dia';
  return dias.map((d) => ABREV[d - 1]).join(', ');
}

export const paraRascunho = (linhas: LinhaServidor[]): LinhaMatriz[] =>
  linhas.map((l) => ({
    disciplina_id: l.disciplina_id,
    professor_id: l.professor_id,
    tempos_semana: l.tempos_semana,
  }));

export function houveAlteracao(base: LinhaMatriz[], atual: LinhaMatriz[]): boolean {
  if (base.length !== atual.length) return true;
  const mapa = new Map(base.map((l) => [l.disciplina_id, l]));
  return atual.some((l) => {
    const b = mapa.get(l.disciplina_id);
    return !b || b.professor_id !== l.professor_id || b.tempos_semana !== l.tempos_semana;
  });
}

export const totalTempos = (linhas: LinhaMatriz[]) =>
  linhas.reduce((soma, l) => soma + l.tempos_semana, 0);

/** Carga docente por professor, pronta para CSV (separador ";" + BOM para o Excel) */
export function cargaDocenteCsv(linhas: LinhaServidor[]): string {
  const porProfessor = new Map<string, { turmas: Set<string>; disciplinas: Set<string>; tempos: number }>();
  for (const l of linhas) {
    if (!l.professor) continue;
    const e = porProfessor.get(l.professor) ?? { turmas: new Set(), disciplinas: new Set(), tempos: 0 };
    e.turmas.add(l.turma);
    e.disciplinas.add(l.disciplina);
    e.tempos += l.tempos_semana;
    porProfessor.set(l.professor, e);
  }
  const cab = ['Professor', 'Disciplinas', 'Turmas', 'Tempos/semana'];
  const corpo = [...porProfessor.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt'))
    .map(([nome, e]) => [nome, [...e.disciplinas].join(' | '), [...e.turmas].join(' | '), String(e.tempos)]);
  return [cab, ...corpo].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\r\n');
}

export function baixarTexto(nome: string, conteudo: string) {
  const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}