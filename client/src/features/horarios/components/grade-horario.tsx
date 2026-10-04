import { Fragment } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { AulaGerada, Referencias } from '@/features/geracao/types';
import { cn } from '@/lib/utils';
import { DIAS_LONGO, chaveAula, descreverAula, type ModoVista } from '../utils';

interface Props {
  modo: ModoVista;
  aulas: AulaGerada[]; // já filtradas para a turma / docente / sala em vista
  referencias: Referencias;
  emConflito: Set<string>;
  editavel?: boolean;
  origem?: { dia: number; tempo: number } | null;
  onCelula?: (dia: number, tempo: number) => void;
}

export function GradeHorario({ modo, aulas, referencias, emConflito, editavel, origem, onCelula }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-190 border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="w-24 px-3 py-3 text-left font-medium">Horário</th>
            {DIAS_LONGO.map((d) => (
              <th key={d} className="px-3 py-3 text-left font-medium">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {referencias.tempos.map((t) => (
            <Fragment key={t.numero}>
              <tr className="border-t border-dashed border-border">
                <td className="px-3 py-2 align-middle">
                  <p className="text-sm font-semibold tabular-nums">
                    T{t.numero}
                  </p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {t.hora_inicio} – {t.hora_fim}
                  </p>
                </td>

                {DIAS_LONGO.map((_, i) => {
                  const dia = i + 1;
                  const doTempo = aulas.filter((a) => a.dia === dia && a.tempo === t.numero);
                  const conflito = doTempo.some((a) => emConflito.has(chaveAula(a)));
                  const selecionada = origem?.dia === dia && origem.tempo === t.numero;

                  return (
                    <td key={dia} className="p-1.5 align-top">
                      <div
                        role={editavel ? 'button' : undefined}
                        tabIndex={editavel ? 0 : undefined}
                        onClick={() => editavel && onCelula?.(dia, t.numero)}
                        onKeyDown={(e) => {
                          if (editavel && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onCelula?.(dia, t.numero);
                          }
                        }}
                        className={cn(
                          'min-h-16 rounded-[4px] border p-2 transition-colors',
                          doTempo.length === 0
                            ? 'border-dashed border-border text-muted-foreground/50'
                            : 'border-border bg-muted/40',
                          conflito && 'border-foreground bg-hatch',
                          editavel && 'cursor-pointer hover:border-foreground',
                          selecionada && 'ring-2 ring-foreground',
                        )}
                      >
                        {doTempo.length === 0 ? (
                          <p className="py-3 text-center text-[11px] uppercase tracking-wider">— vago —</p>
                        ) : (
                          doTempo.map((a) => {
                            const d = descreverAula(a, modo, referencias);
                            return (
                              <div key={chaveAula(a)} className="space-y-0.5" title={d.nomeCompleto}>
                                <div className="flex items-start justify-between gap-1">
                                  <p className="flex items-center gap-1 truncate font-medium leading-tight">
                                    {conflito && <AlertTriangle className="size-3 shrink-0" />}
                                    {d.titulo}
                                  </p>
                                  {d.etiqueta && (
                                    <span className="shrink-0 rounded-[3px] bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                      {d.etiqueta}
                                    </span>
                                  )}
                                </div>
                                <p className="truncate text-[11px] text-muted-foreground">{d.detalhe}</p>
                                {conflito && (
                                  <span className="inline-block rounded-[3px] bg-foreground px-1 text-[9px] font-semibold uppercase tracking-wider text-background">
                                    Conflito
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {t.numero === referencias.intervalo_apos_tempo && (
                <tr>
                  <td colSpan={6} className="bg-hatch px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider">
                    Intervalo
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}