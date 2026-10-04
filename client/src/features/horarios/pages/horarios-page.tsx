import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Check, Pencil, Printer, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { SectionLabel } from '@/components/shared/section-label';
import { useVersoes } from '@/features/geracao/hooks';
import { formatarData, rotuloTurma } from '@/features/geracao/utils';
import { ANO_LECTIVO } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { GradeHorario } from '../components/grade-horario';
import { useMoverAula, usePublicarVersao, useVersaoDetalhe } from '../hooks';
import {
  DIAS_LONGO,
  celulasEmConflito,
  descreverAula,
  detectarConflitos,
  imprimirGrade,
  metricasVista,
  normalizarSala,
  type ModoVista,
} from '../utils';

const sel =
  'h-9 w-full rounded-[4px] border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

const MODOS: { valor: ModoVista; rotulo: string }[] = [
  { valor: 'turma', rotulo: 'Turma' },
  { valor: 'docente', rotulo: 'Docente' },
  { valor: 'sala', rotulo: 'Sala' },
];

const ROTULO_ENTIDADE: Record<ModoVista, string> = { turma: 'Turma', docente: 'Docente', sala: 'Sala' };

export default function HorariosPage() {
  const versoes = useVersoes(true);
  const publicar = usePublicarVersao();

  const [periodoSel, setPeriodoSel] = useState<number | null>(null);
  const [versaoSel, setVersaoSel] = useState<number | null>(null);
  const [modo, setModo] = useState<ModoVista>('turma');
  const [escolhas, setEscolhas] = useState<Partial<Record<ModoVista, string>>>({});
  const [editar, setEditar] = useState(false);
  const [origem, setOrigem] = useState<{ dia: number; tempo: number } | null>(null);

  const lista = versoes.data ?? [];
  const periodos = [...new Map(lista.map((v) => [v.periodo_id, v.periodo])).entries()];
  const periodoId = periodoSel ?? (lista.find((v) => v.estado === 'ativo') ?? lista[0])?.periodo_id ?? null;
  const doPeriodo = lista.filter((v) => v.periodo_id === periodoId);
  const versao = doPeriodo.find((v) => v.id === versaoSel) ?? doPeriodo.find((v) => v.estado === 'ativo') ?? doPeriodo[0];

  const detalhe = useVersaoDetalhe(versao?.id ?? null);
  const mover = useMoverAula(versao?.id ?? null);
  const ref = detalhe.data?.referencias;
  const aulas = useMemo(() => detalhe.data?.aulas ?? [], [detalhe.data]);

  // opções do seletor, conforme o modo
  const opcoes = useMemo(() => {
    if (!ref) return { turma: [], docente: [], sala: [] } as Record<ModoVista, { valor: string; rotulo: string }[]>;
    const turmas = [...new Set(aulas.map((a) => a.turma_id))]
      .filter((id) => ref.turmas[id])
      .map((id) => ({ valor: String(id), rotulo: rotuloTurma(ref.turmas[id]) }));
    const docentes = [...new Set(aulas.map((a) => a.professor_id))]
      .map((id) => ({ valor: String(id), rotulo: ref.professores[id] ?? String(id) }))
      .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt'));
    const salas = [...new Set(aulas.map((a) => (ref.turmas[a.turma_id]?.sala ?? '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'pt'))
      .map((s) => ({ valor: s, rotulo: s }));
    return { turma: turmas, docente: docentes, sala: salas };
  }, [ref, aulas]);

  const lista_modo = opcoes[modo];
  const entidade = lista_modo.find((o) => o.valor === escolhas[modo])?.valor ?? lista_modo[0]?.valor ?? null;
  const rotuloEntidade = lista_modo.find((o) => o.valor === entidade)?.rotulo ?? '';

  const aulasVista = useMemo(() => {
    if (!ref || entidade === null) return [];
    if (modo === 'turma') return aulas.filter((a) => a.turma_id === Number(entidade));
    if (modo === 'docente') return aulas.filter((a) => a.professor_id === Number(entidade));
    return aulas.filter((a) => normalizarSala(ref.turmas[a.turma_id]?.sala) === normalizarSala(entidade));
  }, [aulas, ref, modo, entidade]);

  const conflitos = useMemo(() => (ref ? detectarConflitos(aulas, ref) : []), [aulas, ref]);
  const emConflito = useMemo(() => celulasEmConflito(conflitos), [conflitos]);
  const capacidade = (ref?.tempos.length ?? 6) * 5;
  const metricas = metricasVista(aulasVista, capacidade);
  const pct = capacidade ? Math.round((metricas.alocadas / capacidade) * 100) : 0;
  const m = detalhe.data?.versao.metricas;

  const salaBase = modo === 'turma' && ref && entidade ? ref.turmas[Number(entidade)]?.sala : null;
  const podeEditar = modo === 'turma' && !!versao;

  function aoClicarCelula(dia: number, tempo: number) {
    if (!podeEditar || entidade === null) return;
    const temAula = aulasVista.some((a) => a.dia === dia && a.tempo === tempo);
    if (!origem) {
      if (temAula) setOrigem({ dia, tempo });
      return;
    }
    if (origem.dia === dia && origem.tempo === tempo) return setOrigem(null);
    mover.mutate(
      { turmaId: Number(entidade), de: origem, para: { dia, tempo } },
      {
        onSuccess: () => toast.success('Tempo alterado'),
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Não foi possível trocar'),
        onSettled: () => setOrigem(null),
      },
    );
  }

  function aoPublicar() {
    if (!versao) return;
    publicar.mutate(versao.id, {
      onSuccess: () => toast.success(`Versão #${versao.id} publicada como horário ativo`),
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao publicar'),
    });
  }

  function aoImprimir() {
    if (!ref || !versao || !entidade) return;
    imprimirGrade({
      titulo: `Horário · ${ROTULO_ENTIDADE[modo]}: ${rotuloEntidade}`,
      subtitulo: `${versao.periodo} · Versão #${versao.id} (${versao.estado}) · Ano lectivo ${ANO_LECTIVO}`,
      referencias: ref,
      textoCelula: (dia, tempo) =>
        aulasVista
          .filter((a) => a.dia === dia && a.tempo === tempo)
          .map((a) => {
            const d = descreverAula(a, modo, ref);
            return `${d.titulo}\n${d.detalhe}${d.etiqueta ? ` (${d.etiqueta})` : ''}`;
          })
          .join('\n'),
    });
  }

  if (versoes.isLoading) return <p className="p-8 text-sm text-muted-foreground">A carregar…</p>;

  if (lista.length === 0) {
    return (
      <div className="space-y-4 rounded-[4px] border border-dashed border-border p-10 text-center">
        <p className="font-medium">Ainda não há horários gerados.</p>
        <p className="text-sm text-muted-foreground">Gere um horário e guarde-o para o ver aqui.</p>
        <Link to="/gerar-horario" className={buttonVariants({ variant: 'default' })}>
          Ir para Gerar Horário
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-2">
          <SectionLabel>Processamento</SectionLabel>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Horário escolar</h1>
            <span className="rounded-[3px] bg-muted px-2 py-1 text-xs tabular-nums">Ano lectivo {ANO_LECTIVO}</span>
            {versao && (
              <span
                className={cn(
                  'rounded-[3px] border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider',
                  versao.estado === 'ativo' ? 'border-foreground' : 'border-dashed border-border text-muted-foreground',
                )}
              >
                {versao.estado}
              </span>
            )}
          </div>
          {conflitos.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-foreground bg-hatch px-2 py-1 text-xs">
              <AlertTriangle className="size-3.5" /> {conflitos.length} conflito(s) ativo(s)
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {versao?.estado === 'rascunho' && (
            <Button variant="outline" disabled={publicar.isPending || conflitos.length > 0} onClick={aoPublicar}>
              <Send className="size-4" /> Publicar como ativo
            </Button>
          )}
          <Button variant="outline" disabled={!podeEditar} onClick={() => { setEditar((v) => !v); setOrigem(null); }}>
            <Pencil className="size-4" /> {editar ? 'Concluir edição' : 'Editar tempos'}
          </Button>
          <Button onClick={aoImprimir} disabled={!entidade}>
            <Printer className="size-4" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1">
          <SectionLabel>Período</SectionLabel>
          <select
            className={sel}
            value={periodoId ?? ''}
            onChange={(e) => {
              setPeriodoSel(Number(e.target.value));
              setVersaoSel(null);
              setOrigem(null);
            }}
          >
            {periodos.map(([id, nome]) => (
              <option key={id} value={id}>
                {nome}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <SectionLabel>Versão</SectionLabel>
          <select
            className={sel}
            value={versao?.id ?? ''}
            onChange={(e) => {
              setVersaoSel(Number(e.target.value));
              setOrigem(null);
            }}
          >
            {doPeriodo.map((v) => (
              <option key={v.id} value={v.id}>
                #{v.id} · {v.estado} · {formatarData(v.criado_em)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <SectionLabel>{ROTULO_ENTIDADE[modo]}</SectionLabel>
          <select
            className={sel}
            value={entidade ?? ''}
            onChange={(e) => {
              setEscolhas((p) => ({ ...p, [modo]: e.target.value }));
              setOrigem(null);
            }}
          >
            {lista_modo.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-1">
          <SectionLabel>Modo de exibição</SectionLabel>
          <div className="flex gap-1 rounded-[4px] border border-border bg-background p-1">
            {MODOS.map((x) => (
              <button
                key={x.valor}
                type="button"
                onClick={() => {
                  setModo(x.valor);
                  setOrigem(null);
                  if (x.valor !== 'turma') setEditar(false);
                }}
                className={cn(
                  'flex-1 rounded-[3px] px-2 py-1.5 text-sm transition-colors',
                  modo === x.valor ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {x.rotulo}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Grade */}
        <section className="rounded-[4px] border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
            <SectionLabel>
              Mapa horário semanal · {ROTULO_ENTIDADE[modo]}: {rotuloEntidade || '—'}
            </SectionLabel>
            {salaBase && (
              <span className="text-xs text-muted-foreground">
                Sala base: <strong className="text-foreground">{salaBase}</strong>
              </span>
            )}
          </div>

          {editar && podeEditar && (
            <p className="border-b border-dashed border-border bg-muted/40 px-5 py-2 text-xs">
              Modo de edição: clique numa aula e depois no tempo de destino. Se o destino tiver aula, as duas trocam de
              lugar. A troca é recusada se criar conflito de professor ou sala.
              {origem && ` Origem: ${DIAS_LONGO[origem.dia - 1]}, T${origem.tempo}.`}
            </p>
          )}

          {ref && entidade !== null ? (
            <GradeHorario
              modo={modo}
              aulas={aulasVista}
              referencias={ref}
              emConflito={emConflito}
              editavel={editar && podeEditar && !mover.isPending}
              origem={origem}
              onCelula={aoClicarCelula}
            />
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {detalhe.isLoading ? 'A carregar…' : 'Esta versão não tem aulas para mostrar.'}
            </p>
          )}
        </section>

        {/* Diagnóstico */}
        <aside className="space-y-4">
          <div className={cn('rounded-[4px] border bg-card p-4', conflitos.length ? 'border-foreground' : 'border-border')}>
            <SectionLabel>Diagnóstico · conflitos ({conflitos.length})</SectionLabel>
            {conflitos.length === 0 ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="size-4" /> Nenhum professor ou sala com duas aulas no mesmo tempo.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {conflitos.map((c, i) => (
                  <div key={i} className="space-y-1 rounded-[4px] border border-dashed border-border bg-hatch p-3 text-xs">
                    <p className="font-semibold uppercase tracking-wider">
                      {c.tipo === 'professor' ? 'Professor' : 'Sala'} · {c.nome}
                    </p>
                    <p className="tabular-nums">
                      {DIAS_LONGO[c.dia - 1]} · T{c.tempo}
                    </p>
                    {ref &&
                      c.aulas.map((a) => (
                        <p key={`${a.turma_id}`} className="text-muted-foreground">
                          {rotuloTurma(ref.turmas[a.turma_id])} · {ref.disciplinas[a.disciplina_id]?.nome}
                        </p>
                      ))}
                  </div>
                ))}
                <Link to="/gerar-horario" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
                  Resolver no Gerador
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-[4px] border border-border bg-card p-4">
            <SectionLabel>Métricas · {ROTULO_ENTIDADE[modo].toLowerCase()} em vista</SectionLabel>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Aulas alocadas</span>
              <span className="font-semibold tabular-nums">
                {metricas.alocadas} / {metricas.capacidade} tempos
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-[2px] bg-muted">
              <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
            </div>
            <dl className="divide-y divide-dashed divide-border text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Janelas (tempos vagos entre aulas)</dt>
                <dd className="font-medium tabular-nums">{metricas.janelas}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Dias com aulas</dt>
                <dd className="font-medium tabular-nums">{metricas.dias}</dd>
              </div>
            </dl>
          </div>

          {m && (
            <div className="space-y-2 rounded-[4px] border border-border bg-card p-4">
              <SectionLabel>Geração · versão #{versao?.id}</SectionLabel>
              <dl className="divide-y divide-dashed divide-border text-sm">
                {[
                  ['Aulas colocadas', `${m.colocadas} / ${m.total_aulas}`],
                  ['Janelas de professores', String(m.janelas_professores)],
                  ['Fora dos dias preferenciais', String(m.fora_dias_preferenciais)],
                  ['Seed', String(m.seed)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <p className="rounded-[4px] border border-dashed border-border p-3 text-xs text-muted-foreground">
            «Imprimir / PDF» abre o diálogo de impressão em A4 horizontal. Em «Destino», escolha «Guardar como PDF».
          </p>
        </aside>
      </div>
    </div>
  );
}