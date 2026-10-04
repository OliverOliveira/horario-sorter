import { Fragment } from 'react';
import type { AulaGerada, Referencias } from '../types';
import { DIAS_ABREV } from '../utils';

interface Props {
  aulas: AulaGerada[];
  turmaId: number;
  referencias: Referencias;
}

export function GradeTurma({ aulas, turmaId, referencias }: Props) {
  const mapa = new Map(
    aulas.filter((a) => a.turma_id === turmaId).map((a) => [`${a.dia}-${a.tempo}`, a]),
  );

  return (
    <div className="overflow-x-auto rounded-[4px] border border-border">
      <table className="w-full min-w-160 border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="w-24 px-3 py-2 text-left font-medium">Tempo</th>
            {DIAS_ABREV.map((d) => (
              <th key={d} className="px-3 py-2 text-left font-medium">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {referencias.tempos.map((t) => (
            <Fragment key={t.numero}>
              <tr className="border-t border-dashed border-border">
                <td className="px-3 py-2 align-top">
                  <p className="text-xs font-semibold tabular-nums">T{t.numero}</p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {t.hora_inicio}–{t.hora_fim}
                  </p>
                </td>
                {DIAS_ABREV.map((_, i) => {
                  const a = mapa.get(`${i + 1}-${t.numero}`);
                  const disc = a ? referencias.disciplinas[a.disciplina_id] : null;
                  const prof = a ? referencias.professores[a.professor_id] : null;
                  return (
                    <td key={i} className="px-2 py-1.5 align-top">
                      {a ? (
                        <div
                          className="rounded-[3px] border border-border bg-muted/50 px-2 py-1"
                          title={`${disc?.nome} — ${prof}`}
                        >
                          <p className="truncate font-medium leading-tight">{disc?.sigla ?? disc?.nome}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{prof}</p>
                        </div>
                      ) : (
                        <div className="rounded-[3px] border border-dashed border-border px-2 py-1 text-muted-foreground/40">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
              {t.numero === referencias.intervalo_apos_tempo && (
                <tr>
                  <td colSpan={6} className="bg-hatch px-3 py-1 text-center text-[10px] font-semibold uppercase tracking-wider">
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