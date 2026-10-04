import type { AulaGerada, Referencias } from '@/features/geracao/types';
import { rotuloTurma } from '@/features/geracao/utils';

export type ModoVista = 'turma' | 'docente' | 'sala';

export const DIAS_LONGO = ['2ª feira', '3ª feira', '4ª feira', '5ª feira', '6ª feira'];

export const normalizarSala = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
export const chaveAula = (a: AulaGerada) => `${a.turma_id}-${a.dia}-${a.tempo}`;

export interface Conflito {
  tipo: 'professor' | 'sala';
  nome: string;
  dia: number;
  tempo: number;
  aulas: AulaGerada[];
}

export function detectarConflitos(aulas: AulaGerada[], ref: Referencias): Conflito[] {
  const porProf = new Map<string, AulaGerada[]>();
  const porSala = new Map<string, AulaGerada[]>();
  const juntar = (m: Map<string, AulaGerada[]>, k: string, a: AulaGerada) => m.set(k, [...(m.get(k) ?? []), a]);

  for (const a of aulas) {
    juntar(porProf, `${a.professor_id}|${a.dia}|${a.tempo}`, a);
    const sala = normalizarSala(ref.turmas[a.turma_id]?.sala);
    if (sala) juntar(porSala, `${sala}|${a.dia}|${a.tempo}`, a);
  }

  const out: Conflito[] = [];
  for (const l of porProf.values()) {
    if (l.length > 1) {
      out.push({ tipo: 'professor', nome: ref.professores[l[0].professor_id], dia: l[0].dia, tempo: l[0].tempo, aulas: l });
    }
  }
  for (const l of porSala.values()) {
    if (l.length > 1) {
      out.push({ tipo: 'sala', nome: ref.turmas[l[0].turma_id]?.sala ?? '', dia: l[0].dia, tempo: l[0].tempo, aulas: l });
    }
  }
  return out;
}

export const celulasEmConflito = (c: Conflito[]) => new Set(c.flatMap((x) => x.aulas.map(chaveAula)));

export function descreverAula(a: AulaGerada, modo: ModoVista, ref: Referencias) {
  const disc = ref.disciplinas[a.disciplina_id];
  const turma = ref.turmas[a.turma_id];
  const prof = ref.professores[a.professor_id] ?? '';
  const nomeTurma = turma ? rotuloTurma(turma) : '';
  const titulo = disc?.sigla || disc?.nome || '';
  if (modo === 'turma') return { titulo, nomeCompleto: disc?.nome ?? '', detalhe: prof, etiqueta: turma?.sala ?? '' };
  if (modo === 'docente') return { titulo, nomeCompleto: disc?.nome ?? '', detalhe: nomeTurma, etiqueta: turma?.sala ?? '' };
  return { titulo, nomeCompleto: disc?.nome ?? '', detalhe: `${nomeTurma} · ${prof}`, etiqueta: '' };
}

export function metricasVista(aulas: AulaGerada[], capacidade: number) {
  let janelas = 0;
  let dias = 0;
  for (let d = 1; d <= 5; d++) {
    const ts = aulas.filter((a) => a.dia === d).map((a) => a.tempo).sort((x, y) => x - y);
    if (ts.length === 0) continue;
    dias++;
    janelas += ts[ts.length - 1] - ts[0] + 1 - new Set(ts).size;
  }
  return { alocadas: aulas.length, capacidade, janelas, dias };
}

/** Abre o diálogo de impressão (A4 horizontal) com a grade. Em «Destino», escolher «Guardar como PDF». */
export function imprimirGrade(opcoes: {
  titulo: string;
  subtitulo: string;
  referencias: Referencias;
  textoCelula: (dia: number, tempo: number) => string;
}) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const { referencias: ref } = opcoes;

  const linhas = ref.tempos
    .map((t) => {
      const celulas = [1, 2, 3, 4, 5]
        .map((d) => `<td>${opcoes.textoCelula(d, t.numero).split('\n').map(esc).join('<br>')}</td>`)
        .join('');
      const linha = `<tr><th>T${t.numero}<br><small>${t.hora_inicio}–${t.hora_fim}</small></th>${celulas}</tr>`;
      return t.numero === ref.intervalo_apos_tempo
        ? `${linha}<tr class="int"><td colspan="6">INTERVALO</td></tr>`
        : linha;
    })
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(opcoes.titulo)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: Arial, sans-serif; color: #000; }
  h1 { font-size: 18px; margin: 0; }
  p { margin: 2px 0 12px; font-size: 12px; color: #444; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1px solid #000; padding: 6px; font-size: 11px; vertical-align: top; height: 46px; }
  th { background: #eee; }
  .int td { background: repeating-linear-gradient(45deg,#ddd,#ddd 4px,#fff 4px,#fff 8px);
            text-align: center; font-weight: bold; height: auto; padding: 3px; }
</style></head><body>
<h1>${esc(opcoes.titulo)}</h1><p>${esc(opcoes.subtitulo)}</p>
<table><thead><tr><th style="width:90px">Tempo</th>${['2ª feira', '3ª feira', '4ª feira', '5ª feira', '6ª feira']
    .map((d) => `<th>${d}</th>`)
    .join('')}</tr></thead><tbody>${linhas}</tbody></table>
</body></html>`;

  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 200);
}