import { useMemo, useState } from 'react';
import { Download, Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SectionLabel } from '@/components/shared/section-label';
import { ANO_LECTIVO } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { MatrizTable } from '../components/matriz-table';
import {
  useCandidatos,
  useGravarMatriz,
  useIncompatibilidades,
  useMatriz,
  useTodasAtribuicoes,
  useTurmasOpcoes,
} from '../matriz.hooks';
import type { LinhaMatriz } from '../matriz.types';
import {
  baixarTexto,
  cargaDocenteCsv,
  houveAlteracao,
  paraRascunho,
  totalTempos,
} from '../matriz.utils';

export default function AtribuicoesPage() {
  const { data: turmas = [] } = useTurmasOpcoes();
  const { data: candidatos = [] } = useCandidatos();
  const todas = useTodasAtribuicoes();
  const incompat = useIncompatibilidades();

  const [turmaEscolhida, setTurmaEscolhida] = useState<number | null>(null);
  const [turmaPendente, setTurmaPendente] = useState<number | null>(null); // aguarda confirmação
  const [rascunho, setRascunho] = useState<LinhaMatriz[] | null>(null);

  const turmaId = turmaEscolhida ?? turmas[0]?.id ?? null;
  const { data: matriz, isLoading } = useMatriz(turmaId);
  const gravar = useGravarMatriz(turmaId);

  const base = useMemo(() => (matriz ? paraRascunho(matriz.linhas) : []), [matriz]);
  const linhas = rascunho ?? base;
  const alterado = rascunho !== null && houveAlteracao(base, rascunho);

  const disciplinas = useMemo(
    () => new Map((matriz?.disciplinas ?? []).map((d) => [d.id, d])),
    [matriz],
  );
  const disponiveis = (matriz?.disciplinas ?? []).filter(
    (d) => !linhas.some((l) => l.disciplina_id === d.id),
  );

  const capacidade = matriz?.turma.capacidade ?? 0;
  const atribuidos = totalTempos(linhas);
  const pendentes = linhas.filter((l) => l.professor_id === null).length;
  const percentagem = capacidade ? Math.min(100, Math.round((atribuidos / capacidade) * 100)) : 0;
  const excede = atribuidos > capacidade;

  function editar(fn: (l: LinhaMatriz[]) => LinhaMatriz[]) {
    setRascunho(fn(linhas));
  }

  function mudarTurma(id: number) {
    if (id === turmaId) return;
    if (alterado) setTurmaPendente(id);
    else {
      setRascunho(null);
      setTurmaEscolhida(id);
    }
  }

  function confirmarTroca() {
    setRascunho(null);
    setTurmaEscolhida(turmaPendente);
    setTurmaPendente(null);
  }

  function onGravar() {
    gravar.mutate(linhas, {
      onSuccess: () => {
        setRascunho(null);
        toast.success('Matriz gravada');
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao gravar'),
    });
  }

  async function onVerificar() {
    await todas.refetch();
    const { data } = await incompat.refetch();
    if (!data) return;
    const n = data.turmas.length + data.professores.length;
    if (n === 0) toast.success('Sem incompatibilidades');
    else toast.warning(`${n} incompatibilidade(s) encontrada(s)`);
  }

  function exportar() {
    const dados = todas.data ?? [];
    if (!dados.length) return toast.info('Ainda não há atribuições para exportar');
    baixarTexto(`carga-docente-${ANO_LECTIVO.replace('/', '-')}.csv`, cargaDocenteCsv(dados));
  }

  const t = matriz?.turma;
  const resultado = incompat.data;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <SectionLabel>Planeamento</SectionLabel>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Atribuições curriculares</h1>
            <span className="rounded-sm border border-border px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {ANO_LECTIVO}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportar}>
            <Download className="size-4" /> Exportar carga docente (.CSV)
          </Button>
          <Button variant="outline" onClick={onVerificar} disabled={incompat.isFetching}>
            <ShieldCheck className="size-4" /> Verificar incompatibilidades
          </Button>
        </div>
      </div>

      {/* Turma + progresso */}
      <section className="grid gap-6 rounded-[4px] border border-border bg-card p-5 md:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <SectionLabel>Turma</SectionLabel>
          <select
            aria-label="Turma"
            value={turmaId ?? ''}
            onChange={(e) => mudarTurma(Number(e.target.value))}
            className="h-9 w-full rounded-[4px] border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {turmas.map((x) => (
              <option key={x.id} value={x.id}>
                {x.classe}ª {x.curso} {x.nome}
              </option>
            ))}
          </select>
          {t && (
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Período</dt>
                <dd className="font-medium">{t.periodo}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Alunos</dt>
                <dd className="font-medium tabular-nums">{t.alunos ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Sala</dt>
                <dd className="font-medium">{t.sala ?? '—'}</dd>
              </div>
            </dl>
          )}
        </div>

        <div className="space-y-3">
          <SectionLabel>Tempos atribuídos</SectionLabel>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-3xl font-semibold tabular-nums', excede && 'underline decoration-dashed')}>
              {atribuidos}
            </span>
            <span className="text-muted-foreground tabular-nums">/ {capacidade}</span>
            <span className="ml-auto text-sm tabular-nums text-muted-foreground">{percentagem}% preenchido</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-[2px] bg-muted">
            <div className="h-full bg-foreground transition-all" style={{ width: `${percentagem}%` }} />
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {pendentes} disciplina(s) sem professor · capacidade = {capacidade / 5 || 0} tempos × 5 dias
          </p>
        </div>
      </section>

      {/* Matriz */}
      <section className="rounded-[4px] border border-border bg-card">
        <div className="flex items-center justify-between border-b border-dashed border-border px-5 py-3">
          <SectionLabel>Matriz de carga horária</SectionLabel>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              disabled={disponiveis.length === 0}
            >
              <Plus className="size-4" /> Adicionar disciplina
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 overflow-auto">
              {disponiveis.map((d) => (
                <DropdownMenuItem
                  key={d.id}
                  onClick={() =>
                    editar((l) => [
                      ...l,
                      { disciplina_id: d.id, professor_id: null, tempos_semana: d.carga_semanal },
                    ])
                  }
                >
                  {d.nome}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">A carregar…</p>
        ) : (
          <MatrizTable
            linhas={linhas}
            disciplinas={disciplinas}
            candidatos={candidatos}
            onChange={(id, p) => editar((l) => l.map((x) => (x.disciplina_id === id ? { ...x, ...p } : x)))}
            onRemover={(id) => editar((l) => l.filter((x) => x.disciplina_id !== id))}
          />
        )}

        <div className="flex items-center justify-end gap-2 border-t border-dashed border-border px-5 py-3">
          <Button variant="ghost" disabled={!alterado} onClick={() => setRascunho(null)}>
            Descartar alterações
          </Button>
          <Button disabled={!alterado || gravar.isPending} onClick={onGravar}>
            {gravar.isPending ? 'A gravar…' : 'Gravar alterações da matriz'}
          </Button>
        </div>
      </section>

      {/* Regras + distribuição */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[4px] border border-border bg-card p-5">
          <SectionLabel>Regras validadas</SectionLabel>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Só pode ser atribuído um professor que leciona a disciplina (definido no cadastro do professor).</li>
            <li>• O total de tempos da turma não deve exceder a capacidade semanal do período.</li>
            <li>• O total de tempos de um professor não deve exceder a capacidade semanal do período.</li>
            <li>• Disciplinas sem professor ficam pendentes e não entram na geração do horário.</li>
          </ul>
        </div>

        <div className="rounded-[4px] border border-border bg-card p-5">
          <SectionLabel>Distribuição da turma</SectionLabel>
          <dl className="mt-3 divide-y divide-dashed divide-border text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Tempos atribuídos</dt>
              <dd className="font-medium tabular-nums">{atribuidos}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Disciplinas pendentes</dt>
              <dd className="font-medium tabular-nums">{pendentes}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Conflitos (todas as turmas)</dt>
              <dd className="font-medium tabular-nums">
                {resultado ? resultado.turmas.length + resultado.professores.length : '—'}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Resultado da verificação */}
      {resultado && resultado.turmas.length + resultado.professores.length > 0 && (
        <section className="rounded-[4px] border border-dashed border-border bg-hatch p-5">
          <SectionLabel>Incompatibilidades encontradas</SectionLabel>
          <ul className="mt-3 space-y-1.5 text-sm">
            {resultado.turmas.map((x) => (
              <li key={`t${x.id}`} className="tabular-nums">
                Turma <strong>{x.nome}</strong>: {x.total} tempos atribuídos para uma capacidade de {x.capacidade}.
              </li>
            ))}
            {resultado.professores.map((x) => (
              <li key={`p${x.id}${x.periodo}`} className="tabular-nums">
                Professor <strong>{x.nome}</strong> ({x.periodo}): {x.total} tempos para uma capacidade de{' '}
                {x.capacidade}.
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Confirmação ao trocar de turma com alterações por gravar */}
      <AlertDialog open={turmaPendente !== null} onOpenChange={(o) => !o && setTurmaPendente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem alterações por gravar nesta turma. Se mudar de turma agora, elas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar a editar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarTroca}>Descartar e mudar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}