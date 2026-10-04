import type { AnaliseTempo, EstadoTempo, PeriodoConfig, Rascunho } from './config.types';

export const ORDINAIS = ['1º', '2º', '3º', '4º', '5º', '6º'];

export function paraMin(h: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(h)) return null;
  return Number(h.slice(0, 2)) * 60 + Number(h.slice(3));
}

export function formatarDuracao(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function rascunhoDe(p: PeriodoConfig): Rascunho {
  return {
    intervalo_apos_tempo: p.intervalo_apos_tempo,
    tempos: [1, 2, 3, 4, 5, 6].map(
      (n) => p.tempos.find((t) => t.numero === n) ?? { numero: n, hora_inicio: '', hora_fim: '' },
    ),
  };
}

export const houveAlteracao = (a: Rascunho, b: Rascunho) => JSON.stringify(a) !== JSON.stringify(b);

/** Rótulo curto de um período, ex.: "Manhã (07:30 – 12:35)" */
export function rotuloPeriodo(p: PeriodoConfig): string {
  const t = [...p.tempos].sort((a, b) => a.numero - b.numero);
  if (t.length === 0) return `${p.nome} (por definir)`;
  return `${p.nome} (${t[0].hora_inicio} – ${t[t.length - 1].hora_fim})`;
}

export function analisar(r: Rascunho): AnaliseTempo[] {
  return r.tempos.map((t, i) => {
    const ini = paraMin(t.hora_inicio);
    const fim = paraMin(t.hora_fim);
    const base: AnaliseTempo = { numero: t.numero, estado: 'ok', duracao: null, mensagem: null };

    if (ini === null || fim === null) {
      return { ...base, estado: 'incompleto' as EstadoTempo };
    }
    if (fim <= ini) {
      return {
        ...base,
        estado: 'invalido',
        mensagem: `Tempo ${t.numero}: a saída (${t.hora_fim}) deve ser depois da entrada (${t.hora_inicio}).`,
      };
    }

    const resultado: AnaliseTempo = { ...base, duracao: fim - ini };
    const anterior = i > 0 ? r.tempos[i - 1] : null;
    const fimAnterior = anterior ? paraMin(anterior.hora_fim) : null;
    if (anterior && fimAnterior !== null && ini < fimAnterior) {
      return {
        ...resultado,
        estado: 'conflito',
        mensagem: `Tempo ${t.numero} começa às ${t.hora_inicio}, antes do fim do Tempo ${anterior.numero} (${anterior.hora_fim}): sobreposição de ${fimAnterior - ini} min.`,
      };
    }
    return resultado;
  });
}

export function resumir(r: Rascunho, analise: AnaliseTempo[]) {
  const cargaLetiva = analise.reduce((s, a) => s + (a.duracao ?? 0), 0);
  const validos = analise.filter((a) => a.estado === 'ok').length;
  const alertas = analise.filter((a) => a.estado === 'conflito' || a.estado === 'invalido').length;

  const folga = (i: number): number | null => {
    const fim = paraMin(r.tempos[i].hora_fim);
    const ini = paraMin(r.tempos[i + 1].hora_inicio);
    return fim !== null && ini !== null && ini >= fim ? ini - fim : null;
  };

  const idxIntervalo = r.intervalo_apos_tempo - 1;
  const intervalo = folga(idxIntervalo);
  let transicoes = 0;
  for (let i = 0; i < 5; i++) if (i !== idxIntervalo) transicoes += folga(i) ?? 0;

  const inicio = paraMin(r.tempos[0].hora_inicio);
  const fim = paraMin(r.tempos[5].hora_fim);
  const duracaoTotal = inicio !== null && fim !== null && fim > inicio ? fim - inicio : null;

  return { cargaLetiva, validos, alertas, intervalo, transicoes, duracaoTotal };
}