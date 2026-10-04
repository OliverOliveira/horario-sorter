import { Minus, Plus, Trash2 } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { descreverDias } from '../matriz.utils';
import type { Candidato, DisciplinaLite, LinhaMatriz } from '../matriz.types';

interface Props {
  linhas: LinhaMatriz[];
  disciplinas: Map<number, DisciplinaLite>;
  candidatos: Candidato[];
  onChange: (disciplinaId: number, parcial: Partial<LinhaMatriz>) => void;
  onRemover: (disciplinaId: number) => void;
}

const TEMPOS_MAX = 30;

export function MatrizTable({ linhas, disciplinas, candidatos, onChange, onRemover }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Disciplina</TableHead>
          <TableHead>Área curricular</TableHead>
          <TableHead className="min-w-65">Professor atribuído</TableHead>
          <TableHead className="text-center">Tempos / sem.</TableHead>
          <TableHead>Dias preferenciais</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((l) => {
          const d = disciplinas.get(l.disciplina_id);
          const opcoes = candidatos.filter((c) => c.disciplina_id === l.disciplina_id);
          const escolhido = opcoes.find((c) => c.professor_id === l.professor_id);
          const pendente = l.professor_id === null;

          return (
            <TableRow key={l.disciplina_id} className="border-dashed">
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
                    {d?.sigla ?? '—'}
                  </span>
                  <span className="font-medium">{d?.nome}</span>
                </div>
              </TableCell>

              <TableCell className="text-muted-foreground">{d?.area_curricular ?? '—'}</TableCell>

              <TableCell>
                <div className="space-y-1 flex flex-col">
                  <select
                    aria-label={`Professor de ${d?.nome}`}
                    value={l.professor_id ?? ''}
                    onChange={(e) =>
                      onChange(l.disciplina_id, {
                        professor_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="h-8 w-full rounded-[4px] border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">— Selecionar professor —</option>
                    {opcoes.map((c) => (
                      <option key={c.professor_id} value={c.professor_id}>
                        {c.nome} (DOC-{String(c.professor_id).padStart(3, '0')})
                      </option>
                    ))}
                  </select>
                  {pendente && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-sm border border-dashed border-border px-1.5 py-0.5',
                        'text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-hatch',
                      )}
                    >
                      <AlertTriangle className="size-3" />
                      {opcoes.length === 0 ? 'Nenhum professor leciona esta disciplina' : 'Pendente: sem professor'}
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <div className="mx-auto flex w-fit items-center rounded-[4px] border border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-none"
                    aria-label="Diminuir tempos"
                    disabled={l.tempos_semana <= 1}
                    onClick={() => onChange(l.disciplina_id, { tempos_semana: l.tempos_semana - 1 })}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium tabular-nums">{l.tempos_semana}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-none"
                    aria-label="Aumentar tempos"
                    disabled={l.tempos_semana >= TEMPOS_MAX}
                    onClick={() => onChange(l.disciplina_id, { tempos_semana: l.tempos_semana + 1 })}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {escolhido ? descreverDias(escolhido.dias) : '—'}
              </TableCell>

              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Remover ${d?.nome}`}
                  onClick={() => onRemover(l.disciplina_id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}

        {linhas.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
              Esta turma ainda não tem disciplinas. Use «Adicionar disciplina».
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}