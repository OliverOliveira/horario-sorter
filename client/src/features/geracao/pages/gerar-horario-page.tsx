import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Download,
  ExternalLink,
  Eye,
  History,
  RefreshCw,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SectionLabel } from '@/components/shared/section-label';
import { baixarTexto } from '@/features/atribuicoes/matriz.utils';
import { usePeriodosConfig } from '@/features/periodos/config.hooks';
import { analisar, formatarDuracao, rascunhoDe, resumir, rotuloPeriodo } from '@/features/periodos/config.utils';
import { cn } from '@/lib/utils';
import { GradeTurma } from '../components/grade-turma';
import { useApagarVersao, useGerarHorario, useTurmasElegiveis, useVersoes } from '../hooks';
import { obterVersao } from '../api';
import type { ResultadoGeracao } from '../types';
import { csvMatriz, formatarData, rotuloTurma } from '../utils';

const campo =
  'h-8 w-full rounded-[4px] border border-border bg-background px-2 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring';

const DIRETIVAS = [
  ['Conflito zero', 'Nenhum professor, turma ou sala tem duas aulas no mesmo tempo. Restrição dura: nunca é violada.'],
  ['Dias preferenciais', 'Preferência forte, não proibição. Cada aula fora dos dias preferenciais do professor é penalizada.'],
  ['Prioridade', 'A penalização é multiplicada pela prioridade do professor: quem tem maior prioridade tende a ficar com os seus dias.'],
  ['Compacidade', 'Minimiza janelas de professores e de turmas e evita repetir a disciplina no mesmo dia.'],
] as const;

export default function GerarHorarioPage() {
  const { data: periodos = [] } = usePeriodosConfig();
  const { data: turmas = [] } = useTurmasElegiveis();
  const gerar = useGerarHorario();
  const apagar = useApagarVersao();

  const [periodoEscolhido, setPeriodoEscolhido] = useState<number | null>(null);
  const [excluidas, setExcluidas] = useState<Set<number>>(new Set());
  const [params, setParams] = useState({ iteracoes: '1000000', limite: '30', peso: '1.4', seed: '' });
  const [resultado, setResultado] = useState<ResultadoGeracao | null>(null);
  const [previewAberto, setPreviewAberto] = useState(false);
  const [turmaPreview, setTurmaPreview] = useState<number | null>(null);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const versoes = useVersoes(historicoAberto);

  const periodo =
    periodos.find((p) => p.id === periodoEscolhido) ?? periodos.find((p) => p.tempos.length === 6) ?? periodos[0];
  const definido = periodo?.tempos.length === 6;

  const doPeriodo = turmas.filter((t) => t.periodo_id === periodo?.id);
  const elegiveis = doPeriodo.filter((t) => t.tempos_com_professor > 0);
  const selecionadas = elegiveis.filter((t) => !excluidas.has(t.id));
  const totalTempos = selecionadas.reduce((s, t) => s + t.tempos_com_professor, 0);
  const comPendencias = selecionadas.filter((t) => t.tempos_total > t.tempos_com_professor);
  const todasMarcadas = elegiveis.length > 0 && selecionadas.length === elegiveis.length;

  function alternar(id: number) {
    setExcluidas((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function alternarTodas() {
    setExcluidas(todasMarcadas ? new Set(elegiveis.map((t) => t.id)) : new Set());
  }

  function executar(gravar: boolean) {
    if (!periodo || !definido) return;
    gerar.mutate(
      {
        periodo_id: periodo.id,
        turma_ids: selecionadas.map((t) => t.id),
        gravar,
        iteracoes: Number(params.iteracoes) || 1000000,
        limite_s: Number(params.limite) || 30,
        peso_janelas: params.peso === '' ? 1.4 : Number(params.peso),
        seed: params.seed.trim() ? Number(params.seed) : undefined,
      },
      {
        onSuccess: (r) => {
          setResultado(r);
          setTurmaPreview(null);
          const falta = r.nao_colocadas.reduce((s, x) => s + x.em_falta, 0);
          if (falta > 0) toast.warning(`${falta} aula(s) não couberam. Aumente as iterações ou reveja as atribuições.`);
          else toast.success(gravar ? `Horário gerado e guardado (rascunho #${r.versao_id})` : 'Simulação concluída');
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao gerar horário'),
      },
    );
  }

  async function abrirVersao(id: number) {
    try {
      const d = await obterVersao(id);
      setResultado({
        versao_id: d.versao.id,
        aulas: d.aulas,
        nao_colocadas: [],
        ignoradas: [],
        metricas: d.versao.metricas,
        referencias: d.referencias,
      });
      setTurmaPreview(null);
      setHistoricoAberto(false);
      setPreviewAberto(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao abrir versão');
    }
  }

  function exportar() {
    if (!resultado) return;
    baixarTexto(`horario-rascunho${resultado.versao_id ? `-${resultado.versao_id}` : ''}.csv`, csvMatriz(resultado));
  }

  const idsPreview = resultado
    ? [...new Set(resultado.aulas.map((a) => a.turma_id))].filter((id) => resultado.referencias.turmas[id])
    : [];
  const turmaVista = turmaPreview ?? idsPreview[0] ?? null;
  const falta = resultado?.nao_colocadas.reduce((s, x) => s + x.em_falta, 0) ?? 0;
  const estado = gerar.isPending ? 'A gerar…' : resultado ? (falta ? 'Concluído com pendências' : 'Concluído') : 'Em espera';

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div className="max-w-2xl space-y-1">
          <SectionLabel>Processamento</SectionLabel>
          <h1 className="text-2xl font-semibold tracking-tight">Gerar horário</h1>
          <p className="text-sm text-muted-foreground">
            Escolha o período e as turmas. O motor distribui as aulas respeitando conflitos, dias preferenciais e
            prioridades dos professores.
          </p>
        </div>
        <Button variant="outline" onClick={() => setHistoricoAberto(true)}>
          <History className="size-4" /> Histórico de execuções
        </Button>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          {/* 1. Período */}
          <section className="space-y-3">
            <SectionLabel>1 · Período de processamento</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {periodos.map((p) => {
                const ok = p.tempos.length === 6;
                const ativo = p.id === periodo?.id;
                const r = rascunhoDe(p);
                const intervalo = ok ? resumir(r, analisar(r)).intervalo : null;
                const n = turmas.filter((t) => t.periodo_id === p.id && t.tempos_com_professor > 0).length;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!ok}
                    onClick={() => setPeriodoEscolhido(p.id)}
                    className={cn(
                      'rounded-[4px] border bg-card p-4 text-left transition-colors',
                      ativo ? 'border-2 border-foreground' : 'border-border text-muted-foreground',
                      !ok && 'cursor-not-allowed border-dashed opacity-70',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-medium text-foreground">{p.nome}</p>
                      <span className={cn('size-3.5 rounded-full border', ativo ? 'border-4 border-foreground' : 'border-border')} />
                    </div>
                    <p className="text-xs tabular-nums">{rotuloPeriodo(p).replace(`${p.nome} `, '')}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-dashed border-border pt-3 text-xs">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider">Tempos</p>
                        <p className="font-medium text-foreground tabular-nums">{ok ? '6 diários' : 'Por definir'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider">Elegíveis</p>
                        <p className="font-medium text-foreground tabular-nums">{n} turmas</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider">Intervalo</p>
                        <p className="font-medium text-foreground tabular-nums">
                          {intervalo !== null ? formatarDuracao(intervalo) : '—'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {!definido && periodo && (
              <p className="text-xs text-muted-foreground">
                Este período ainda não tem os 6 tempos definidos.{' '}
                <Link to="/periodos" className="underline">
                  Definir em Períodos e Tempos
                </Link>
              </p>
            )}
          </section>

          {/* 2. Turmas */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionLabel>2 · Turmas elegíveis{periodo ? ` (${periodo.nome})` : ''}</SectionLabel>
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-[3px] bg-muted px-2 py-1 tabular-nums">
                  {selecionadas.length} selecionadas de {elegiveis.length}
                </span>
                <button type="button" className="underline" onClick={alternarTodas}>
                  {todasMarcadas ? 'Limpar seleção' : 'Selecionar todas'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[4px] border border-border bg-card">
              <table className="w-full min-w-160 text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="w-10 px-4 py-3" />
                    <th className="px-2 py-3 font-medium">Turma</th>
                    <th className="px-2 py-3 font-medium">Sala</th>
                    <th className="px-2 py-3 font-medium">Carga atribuída</th>
                    <th className="px-2 py-3 font-medium">Estado das atribuições</th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {doPeriodo.map((t) => {
                    const sem = t.disciplinas === 0;
                    const pend = t.tempos_total - t.tempos_com_professor;
                    const excede = t.tempos_total > t.capacidade;
                    const pct = t.capacidade ? Math.min(100, Math.round((t.tempos_total / t.capacidade) * 100)) : 0;
                    const desativada = t.tempos_com_professor === 0;
                    return (
                      <tr key={t.id} className="border-t border-dashed border-border">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="size-4 accent-foreground"
                            aria-label={`Selecionar ${rotuloTurma(t)}`}
                            disabled={desativada}
                            checked={!desativada && !excluidas.has(t.id)}
                            onChange={() => alternar(t.id)}
                          />
                        </td>
                        <td className="px-2 py-3 font-medium">{rotuloTurma(t)}</td>
                        <td className="px-2 py-3">
                          {t.sala ? (
                            <span className="rounded-[3px] bg-muted px-2 py-0.5 text-xs">{t.sala}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <p className="text-xs tabular-nums">
                            {t.tempos_total}/{t.capacidade} tempos <span className="text-muted-foreground">{pct}%</span>
                          </p>
                          <div className="mt-1 h-1 w-32 overflow-hidden rounded-[2px] bg-muted">
                            <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          {sem ? (
                            <span className="inline-flex items-center gap-1 rounded-[3px] border border-dashed border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-hatch">
                              <AlertTriangle className="size-3" /> Sem atribuições
                            </span>
                          ) : pend > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-[3px] border border-dashed border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider bg-hatch">
                              <AlertTriangle className="size-3" /> Pendente: {pend} tempos sem professor
                            </span>
                          ) : excede ? (
                            <span className="inline-flex items-center gap-1 rounded-[3px] border border-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wider bg-hatch">
                              <AlertTriangle className="size-3" /> Excede a capacidade
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-[3px] border border-border bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
                              <Check className="size-3" /> Atribuição completa
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <Link
                            to={`/atribuicoes?turma=${t.id}`}
                            aria-label={`Abrir atribuições de ${rotuloTurma(t)}`}
                            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {doPeriodo.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Não há turmas neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="border-t border-border px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground tabular-nums">
                Total de tempos a processar: {totalTempos}
              </p>
            </div>
          </section>

          {/* 3. Parâmetros */}
          <section className="space-y-3">
            <SectionLabel>3 · Parâmetros e diretivas do motor</SectionLabel>
            <div className="space-y-4 rounded-[4px] border border-border bg-card p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {DIRETIVAS.map(([titulo, texto]) => (
                  <div key={titulo} className="rounded-[4px] border border-border bg-background p-3">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <Check className="size-4" /> {titulo}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{texto}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 rounded-[4px] border border-dashed border-border p-3 sm:grid-cols-4">
                {(
                  [
                    ['Tentativas (iterações)', 'iteracoes', '1000000'],
                    ['Peso das janelas', 'peso', '1.4'],
                    ['Tempo limite (s)', 'limite', '30'],
                    ['Seed (opcional)', 'seed', 'aleatória'],
                  ] as const
                ).map(([rotulo, chave, ph]) => (
                  <label key={chave} className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{rotulo}</span>
                    <input
                      inputMode="decimal"
                      className={campo}
                      placeholder={ph}
                      value={params[chave]}
                      onChange={(e) => setParams((p) => ({ ...p, [chave]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xs text-xs text-muted-foreground">
                  O horário gerado fica guardado como versão provisória (rascunho).
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!definido || selecionadas.length === 0 || gerar.isPending}
                    onClick={() => executar(false)}
                  >
                    <SlidersHorizontal className="size-4" /> Simular sem gravar
                  </Button>
                  <Button
                    disabled={!definido || selecionadas.length === 0 || gerar.isPending}
                    onClick={() => executar(true)}
                  >
                    {gerar.isPending ? <RefreshCw className="size-4 animate-spin" /> : <Zap className="size-4" />}
                    Gerar horário
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Diagnóstico */}
        <aside className="space-y-4 rounded-[4px] border border-border bg-card p-4 xl:sticky xl:top-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Diagnóstico</SectionLabel>
            <span className="rounded-[3px] bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              {gerar.isPending ? 'A correr' : resultado ? 'Pronto' : 'Em espera'}
            </span>
          </div>
          <p className="text-lg font-semibold">{estado}</p>

          {resultado ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Aulas colocadas', `${resultado.metricas.colocadas} / ${resultado.metricas.total_aulas}`],
                  ['Conflitos duros', '0'],
                  ['Iterações', resultado.metricas.iteracoes.toLocaleString('pt-PT')],
                  ['Tempo', `${(resultado.metricas.tempo_ms / 1000).toFixed(2)} s`],
                  ['Janelas de professores', String(resultado.metricas.janelas_professores)],
                  ['Janelas de turmas', String(resultado.metricas.janelas_turmas)],
                  ['Fora dos dias preferenciais', String(resultado.metricas.fora_dias_preferenciais)],
                  ['Custo', String(resultado.metricas.custo)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-[4px] border border-border bg-background p-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
                    <p className="text-sm font-semibold tabular-nums">{v}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">
                Seed: {resultado.metricas.seed}
                {resultado.versao_id ? ` · Rascunho #${resultado.versao_id}` : ' · Simulação (não gravada)'}
              </p>

              {falta > 0 && (
                <div className="space-y-1 rounded-[4px] border border-foreground bg-hatch p-3 text-xs">
                  <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                    <AlertTriangle className="size-3.5" /> {falta} aula(s) por colocar
                  </p>
                  {resultado.nao_colocadas.map((x) => (
                    <p key={`${x.turma_id}-${x.disciplina_id}`}>
                      {rotuloTurma(resultado.referencias.turmas[x.turma_id] ?? { classe: '', curso: String(x.turma_id), nome: '' })}
                      {' · '}
                      {resultado.referencias.disciplinas[x.disciplina_id]?.nome}: {x.em_falta} tempo(s)
                    </p>
                  ))}
                  <p className="text-muted-foreground">
                    Aumente as iterações ou reduza a carga do professor/turma.
                  </p>
                </div>
              )}

              <div className="space-y-2 border-t border-border pt-3">
                <Button className="w-full" variant="outline" disabled={idsPreview.length === 0} onClick={() => setPreviewAberto(true)}>
                  <Eye className="size-4" /> Pré-visualizar grade
                </Button>
                <Button className="w-full" variant="outline" onClick={exportar}>
                  <Download className="size-4" /> Exportar matriz (.CSV)
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Escolha o período e as turmas e clique em «Gerar horário» ou «Simular sem gravar».
            </p>
          )}

          {comPendencias.length > 0 && (
            <div className="space-y-1 rounded-[4px] border border-dashed border-border p-3 text-xs">
              <p className="font-semibold uppercase tracking-wider">Aviso de atribuição incompleta</p>
              {comPendencias.map((t) => (
                <p key={t.id} className="text-muted-foreground">
                  {rotuloTurma(t)} tem {t.tempos_total - t.tempos_com_professor} tempos sem professor. Esses tempos
                  não serão gerados.
                </p>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Pré-visualização */}
      <Sheet open={previewAberto} onOpenChange={setPreviewAberto}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-7xl">
          <SheetHeader>
            <SheetTitle>Grade provisória</SheetTitle>
            <SheetDescription>
              {resultado?.versao_id ? `Rascunho #${resultado.versao_id}` : 'Simulação, não gravada'}
            </SheetDescription>
          </SheetHeader>
          {resultado && turmaVista !== null && (
            <div className="space-y-4 p-4">
              <select
                aria-label="Turma"
                value={turmaVista}
                onChange={(e) => setTurmaPreview(Number(e.target.value))}
                className="h-9 w-full rounded-[4px] border border-border bg-background px-2 text-sm"
              >
                {idsPreview.map((id) => (
                  <option key={id} value={id}>
                    {rotuloTurma(resultado.referencias.turmas[id])}
                  </option>
                ))}
              </select>
              <GradeTurma aulas={resultado.aulas} turmaId={turmaVista} referencias={resultado.referencias} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Histórico */}
      <Sheet open={historicoAberto} onOpenChange={setHistoricoAberto}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-7xl">
          <SheetHeader>
            <SheetTitle>Histórico de execuções</SheetTitle>
            <SheetDescription>Versões guardadas como rascunho.</SheetDescription>
          </SheetHeader>
          <div className="space-y-2 p-4">
            {(versoes.data ?? []).map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 rounded-[4px] border border-border p-3">
                <div className="text-sm">
                  <p className="font-medium">
                    #{v.id} · {v.periodo}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatarData(v.criado_em)} · {v.turmas} turmas · {v.aulas} aulas · seed {v.seed}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => abrirVersao(v.id)}>
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={apagar.isPending}
                    onClick={() => {
                      if (window.confirm(`Apagar o rascunho #${v.id}?`)) apagar.mutate(v.id);
                    }}
                  >
                    Apagar
                  </Button>
                </div>
              </div>
            ))}
            {versoes.data?.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Ainda não há versões guardadas.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}