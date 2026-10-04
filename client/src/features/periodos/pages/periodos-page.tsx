import { Fragment, useState } from 'react';
import { AlertTriangle, Coffee, LogOut, Clock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/shared/section-label';
import { cn } from '@/lib/utils';
import { useGravarPeriodo, usePeriodosConfig } from '../config.hooks';
import type { EstadoTempo, Rascunho } from '../config.types';
import {
  ORDINAIS,
  analisar,
  formatarDuracao,
  houveAlteracao,
  rascunhoDe,
  resumir,
  rotuloPeriodo,
} from '../config.utils';

const ROTULO_ESTADO: Record<EstadoTempo, string> = {
  ok: 'Válido',
  incompleto: 'Incompleto',
  invalido: 'Inválido',
  conflito: 'Conflito',
};

const CLASSE_ESTADO: Record<EstadoTempo, string> = {
  ok: 'border-border bg-muted text-foreground',
  incompleto: 'border-dashed border-border text-muted-foreground',
  invalido: 'border-foreground bg-hatch text-foreground',
  conflito: 'border-foreground bg-hatch text-foreground',
};

const inputHora =
  'h-9 w-full rounded-[4px] border border-border bg-background pl-8 pr-2 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring dark:[color-scheme:dark]';

export default function PeriodosPage() {
  const { data: periodos = [], isLoading } = usePeriodosConfig();
  const gravar = useGravarPeriodo();

  const [periodoEscolhido, setPeriodoEscolhido] = useState<number | null>(null);
  const [rascunhos, setRascunhos] = useState<Record<number, Rascunho>>({});

  const periodo = periodos.find((p) => p.id === periodoEscolhido) ?? periodos[0];

  if (isLoading || !periodo) {
    return <p className="p-8 text-sm text-muted-foreground">A carregar…</p>;
  }

  const base = rascunhoDe(periodo);
  const atual = rascunhos[periodo.id] ?? base;
  const alterado = houveAlteracao(base, atual);
  const analise = analisar(atual);
  const resumo = resumir(atual, analise);
  const mensagens = analise.filter((a) => a.mensagem);
  const tudoValido = analise.every((a) => a.estado === 'ok');
  const pctValidos = Math.round((resumo.validos / 6) * 100);

  function editar(fn: (r: Rascunho) => Rascunho) {
    setRascunhos((prev) => ({ ...prev, [periodo.id]: fn(atual) }));
  }

  function mudarHora(numero: number, campo: 'hora_inicio' | 'hora_fim', valor: string) {
    editar((r) => ({
      ...r,
      tempos: r.tempos.map((t) => (t.numero === numero ? { ...t, [campo]: valor } : t)),
    }));
  }

  function descartar() {
    setRascunhos((prev) => {
      const { [periodo.id]: _descartado, ...resto } = prev;
      return resto;
    });
  }

  function guardar() {
    gravar.mutate(
      { id: periodo.id, dados: atual },
      {
        onSuccess: () => {
          descartar();
          toast.success(`Tempos de ${periodo.nome} guardados`);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao guardar'),
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div className="max-w-2xl space-y-1">
          <SectionLabel>Estrutura horária</SectionLabel>
          <h1 className="text-2xl font-semibold tracking-tight">Períodos e tempos</h1>
          <p className="text-sm text-muted-foreground">
            Defina a hora de entrada e saída dos 6 tempos de cada período e onde aparece o intervalo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!alterado} onClick={descartar}>
            Descartar alterações
          </Button>
          <Button disabled={!alterado || !tudoValido || gravar.isPending} onClick={guardar}>
            <Save className="size-4" /> {gravar.isPending ? 'A guardar…' : 'Guardar tempos'}
          </Button>
        </div>
      </div>

      {/* Seletor de período + métricas */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[4px] border border-border bg-card p-3">
        <div className="flex gap-1 rounded-[4px] border border-border bg-background p-1">
          {periodos.map((p) => {
            const ativo = p.id === periodo.id;
            const sujo = rascunhos[p.id] && houveAlteracao(rascunhoDe(p), rascunhos[p.id]);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodoEscolhido(p.id)}
                className={cn(
                  'flex items-center gap-2 rounded-[3px] px-3 py-1.5 text-sm transition-colors',
                  ativo ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className={cn('size-1.5 rounded-full', ativo ? 'bg-foreground' : 'bg-muted-foreground/50')} />
                {rotuloPeriodo(p)}
                {sujo && <span className="text-[10px] uppercase tracking-wider">· alterado</span>}
              </button>
            );
          })}
        </div>

        <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          {[
            ['Duração total', resumo.duracaoTotal !== null ? formatarDuracao(resumo.duracaoTotal) : '—'],
            ['Carga letiva', formatarDuracao(resumo.cargaLetiva)],
            ['Intervalo', resumo.intervalo !== null ? formatarDuracao(resumo.intervalo) : '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <dt className="uppercase tracking-wider text-muted-foreground">{k}</dt>
              <dd className="rounded-[3px] border border-border bg-background px-2 py-1 font-medium tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Sequenciamento */}
        <section className="rounded-[4px] border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <SectionLabel>Sequenciamento cronológico de aulas</SectionLabel>
            <span className="text-xs text-muted-foreground">{periodo.nome}</span>
          </div>

          <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-x-3 px-5 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Tempo</span>
            <span>Entrada</span>
            <span>Saída</span>
            <span className="text-right">Duração</span>
            <span className="w-24 text-right">Estado</span>
          </div>

          <div>
            {atual.tempos.map((t, i) => {
              const a = analise[i];
              const destaque = a.estado === 'conflito' || a.estado === 'invalido';
              return (
                <Fragment key={t.numero}>
                  <div
                    className={cn(
                      'grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-x-3 border-t border-dashed border-border px-5 py-3',
                      destaque && 'bg-muted/40',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'grid h-7 w-8 place-items-center rounded-[3px] text-xs font-semibold tabular-nums',
                          destaque ? 'bg-foreground text-background' : 'bg-muted',
                        )}
                      >
                        T{t.numero}
                      </span>
                      <span className="hidden w-16 text-xs text-muted-foreground sm:block">
                        {ORDINAIS[i]} bloco
                      </span>
                    </div>

                    <label className="relative block">
                      <Clock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="time"
                        aria-label={`Entrada do tempo ${t.numero}`}
                        value={t.hora_inicio}
                        onChange={(e) => mudarHora(t.numero, 'hora_inicio', e.target.value)}
                        className={inputHora}
                      />
                    </label>

                    <label className="relative block">
                      <LogOut className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="time"
                        aria-label={`Saída do tempo ${t.numero}`}
                        value={t.hora_fim}
                        onChange={(e) => mudarHora(t.numero, 'hora_fim', e.target.value)}
                        className={inputHora}
                      />
                    </label>

                    <span className="min-w-14 rounded-[3px] border border-border bg-background px-2 py-1 text-center text-xs tabular-nums">
                      {a.duracao !== null ? `${a.duracao} min` : '—'}
                    </span>

                    <span className="flex w-24 justify-end">
                      <span
                        className={cn(
                          'rounded-[3px] border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider',
                          CLASSE_ESTADO[a.estado],
                        )}
                      >
                        {ROTULO_ESTADO[a.estado]}
                      </span>
                    </span>
                  </div>

                  {/* Intervalo (visual) depois do tempo escolhido */}
                  {t.numero === atual.intervalo_apos_tempo && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border bg-hatch px-5 py-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                        <Coffee className="size-4" />
                        Intervalo após o tempo
                        <select
                          aria-label="Intervalo após o tempo"
                          value={atual.intervalo_apos_tempo}
                          onChange={(e) => editar((r) => ({ ...r, intervalo_apos_tempo: Number(e.target.value) }))}
                          className="h-7 rounded-[3px] border border-border bg-background px-1.5 text-xs normal-case outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span className="rounded-[3px] border border-border bg-background px-2 py-1 text-xs tabular-nums">
                        {resumo.intervalo !== null
                          ? `${t.hora_fim} – ${atual.tempos[i + 1].hora_inicio} · ${resumo.intervalo} min`
                          : 'Defina os horários'}
                      </span>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>

          {/* Validação */}
          {mensagens.length > 0 && (
            <div className="m-5 flex gap-3 rounded-[4px] border border-foreground bg-hatch p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-1.5 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider">Validação dos tempos</p>
                {mensagens.map((m) => (
                  <p key={m.numero}>{m.mensagem}</p>
                ))}
                <p className="text-xs text-muted-foreground">
                  Corrija os horários para poder guardar.
                </p>
              </div>
            </div>
          )}

          <p className="border-t border-border px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground">
            Total: 6 tempos · 1 intervalo
          </p>
        </section>

        {/* Linha do tempo */}
        <section className="space-y-4">
          <div className="rounded-[4px] border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <SectionLabel>Linha do tempo ({periodo.nome})</SectionLabel>
            </div>
            <div className="space-y-2 p-4">
              {atual.tempos.map((t, i) => {
                const a = analise[i];
                const destaque = a.estado === 'conflito' || a.estado === 'invalido';
                return (
                  <Fragment key={t.numero}>
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-[4px] border p-3',
                        destaque ? 'border-foreground bg-hatch' : 'border-border bg-background',
                        a.estado === 'incompleto' && 'border-dashed',
                      )}
                    >
                      <span className="grid h-7 w-8 shrink-0 place-items-center rounded-[3px] bg-muted text-xs font-semibold tabular-nums">
                        T{t.numero}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{ORDINAIS[i]} tempo letivo</p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {t.hora_inicio && t.hora_fim ? `${t.hora_inicio} – ${t.hora_fim}` : 'Por definir'}
                        </p>
                      </div>
                      {a.duracao !== null && (
                        <span className="rounded-[3px] border border-border bg-card px-2 py-0.5 text-xs tabular-nums">
                          {a.duracao}m
                        </span>
                      )}
                    </div>

                    {t.numero === atual.intervalo_apos_tempo && (
                      <div className="flex items-center justify-between rounded-[4px] border border-dashed border-border bg-hatch px-3 py-2 text-xs font-semibold uppercase tracking-wider">
                        <span className="flex items-center gap-2">
                          <Coffee className="size-3.5" /> Intervalo
                          {resumo.intervalo !== null && ` (${resumo.intervalo}m)`}
                        </span>
                        {resumo.intervalo !== null && (
                          <span className="tabular-nums">
                            {t.hora_fim} – {atual.tempos[i + 1].hora_inicio}
                          </span>
                        )}
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[4px] border border-border bg-card p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Carga letiva</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{resumo.cargaLetiva} min</p>
              <p className="text-xs text-muted-foreground">{formatarDuracao(resumo.cargaLetiva)} úteis</p>
            </div>
            <div className="rounded-[4px] border border-border bg-card p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Descanso</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {(resumo.intervalo ?? 0) + resumo.transicoes} min
              </p>
              <p className="text-xs text-muted-foreground">1 intervalo + transições</p>
            </div>
            <div className={cn('rounded-[4px] border bg-card p-3', resumo.alertas ? 'border-foreground' : 'border-border')}>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Alertas</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold tabular-nums">
                {resumo.alertas > 0 && <AlertTriangle className="size-4" />}
                {resumo.alertas}
              </p>
              <p className="text-xs text-muted-foreground">{resumo.alertas ? 'a corrigir' : 'sem conflitos'}</p>
            </div>
          </div>

          <div className="rounded-[4px] border border-border bg-card p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
              <span>Tempos validados</span>
              <span className="tabular-nums">{pctValidos}% conforme</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-[2px] bg-muted">
              <div className="h-full bg-foreground transition-all" style={{ width: `${pctValidos}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>{resumo.validos} de 6 tempos</span>
              <span>{tudoValido ? 'Pronto a guardar' : 'Requer correção'}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Regras reais */}
      <section className="rounded-[4px] border border-border bg-card p-5">
        <SectionLabel>Regras validadas</SectionLabel>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>• Cada período tem exatamente 6 tempos, todos preenchidos.</li>
          <li>• A saída de cada tempo tem de ser depois da entrada.</li>
          <li>• Um tempo não pode começar antes do fim do anterior (não há sobreposição).</li>
          <li>• O intervalo é apenas visual: aparece depois do tempo escolhido e não altera as durações.</li>
        </ul>
      </section>
    </div>
  );
}