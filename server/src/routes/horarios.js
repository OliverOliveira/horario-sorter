import { Router } from 'express';
import db, { transaction } from '../db.js';
import { HttpError, parseId } from '../http.js';
import { gerarHorario } from '../gerador/solver.js';

const router = Router();

const num = (v, padrao, min, max) => {
  if (v === undefined || v === null || v === '') return padrao;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new HttpError(400, 'Parâmetro numérico inválido');
  return Math.min(max, Math.max(min, n));
};

const temposDoPeriodo = (periodoId) =>
  db
    .prepare('SELECT numero, hora_inicio, hora_fim FROM tempos WHERE periodo_id = ? ORDER BY numero')
    .all(periodoId);

function referencias(periodoId) {
  const periodo = db.prepare('SELECT intervalo_apos_tempo FROM periodos WHERE id = ?').get(periodoId);
  const mapa = (rows, fn) => Object.fromEntries(rows.map((r) => [r.id, fn(r)]));
  return {
    intervalo_apos_tempo: periodo.intervalo_apos_tempo,
    tempos: temposDoPeriodo(periodoId),
    turmas: mapa(
      db.prepare('SELECT id, nome, classe, curso, sala FROM turmas WHERE periodo_id = ?').all(periodoId),
      (r) => ({ nome: r.nome, classe: r.classe, curso: r.curso, sala: r.sala }),
    ),
    disciplinas: mapa(db.prepare('SELECT id, nome, sigla FROM disciplinas').all(), (r) => ({
      nome: r.nome,
      sigla: r.sigla,
    })),
    professores: mapa(db.prepare('SELECT id, nome FROM professores').all(), (r) => r.nome),
  };
}

// ---------- turmas elegíveis (todas; o cliente filtra por período) ----------
router.get('/elegiveis', (_req, res) => {
  res.json(
    db
      .prepare(`
        SELECT t.id, t.nome, t.classe, t.curso, t.sala, t.periodo_id,
               COUNT(a.id) AS disciplinas,
               COALESCE(SUM(a.tempos_semana), 0) AS tempos_total,
               COALESCE(SUM(CASE WHEN a.professor_id IS NOT NULL THEN a.tempos_semana ELSE 0 END), 0)
                 AS tempos_com_professor,
               (SELECT COUNT(*) FROM tempos WHERE periodo_id = t.periodo_id) * 5 AS capacidade
        FROM turmas t
        LEFT JOIN atribuicoes a ON a.turma_id = t.id
        GROUP BY t.id
        ORDER BY t.classe, t.curso, t.nome
      `)
      .all(),
  );
});

// ---------- gerar ----------
router.post('/gerar', (req, res) => {
  const b = req.body ?? {};
  const periodoId = parseId(b.periodo_id);
  if (!db.prepare('SELECT 1 FROM periodos WHERE id = ?').get(periodoId)) {
    throw new HttpError(404, 'Período não encontrado');
  }
  const tempos = temposDoPeriodo(periodoId);
  if (tempos.length !== 6) {
    throw new HttpError(422, 'Defina os 6 tempos deste período em «Períodos e Tempos»');
  }

  const ids = Array.isArray(b.turma_ids) ? b.turma_ids.map(parseId) : [];
  if (ids.length === 0) throw new HttpError(400, 'Selecione pelo menos uma turma');
  const marcas = ids.map(() => '?').join(',');

  const turmas = db
    .prepare(`SELECT id, nome, sala FROM turmas WHERE periodo_id = ? AND id IN (${marcas})`)
    .all(periodoId, ...ids);
  if (turmas.length === 0) throw new HttpError(400, 'Nenhuma das turmas pertence a este período');
  const turmaIds = turmas.map((t) => t.id);

  const atribuicoes = db
    .prepare(
      `SELECT turma_id, disciplina_id, professor_id, tempos_semana AS n
       FROM atribuicoes WHERE turma_id IN (${turmaIds.map(() => '?').join(',')})`,
    )
    .all(...turmaIds);

  const ignoradas = atribuicoes
    .filter((a) => a.professor_id === null)
    .map((a) => ({ turma_id: a.turma_id, disciplina_id: a.disciplina_id, tempos: a.n }));
  const comProfessor = atribuicoes.filter((a) => a.professor_id !== null);
  if (comProfessor.length === 0) {
    throw new HttpError(422, 'As turmas escolhidas não têm disciplinas com professor atribuído');
  }

  const profIds = [...new Set(comProfessor.map((a) => a.professor_id))];
  const professores = db
    .prepare(`SELECT id, prioridade FROM professores WHERE id IN (${profIds.map(() => '?').join(',')})`)
    .all(...profIds)
    .map((p) => ({
      id: p.id,
      prioridade: p.prioridade,
      dias: db
        .prepare('SELECT dia_semana FROM professor_dias_preferenciais WHERE professor_id = ?')
        .all(p.id)
        .map((r) => r.dia_semana),
    }));

  const resultado = gerarHorario({
    turmas: turmas.map((t) => ({ id: t.id, sala: t.sala })),
    aulas: comProfessor.map((a) => ({
      turma_id: a.turma_id,
      disciplina_id: a.disciplina_id,
      professor_id: a.professor_id,
      n: a.n,
    })),
    professores,
    dias: 5,
    tempos: 6,
    iteracoes: Math.round(num(b.iteracoes, 1000000, 1000, 5000000)),
    limiteMs: num(b.limite_s, 30, 1, 120) * 1000,
    pesoJanelas: num(b.peso_janelas, 1.4, 0, 10),
    seed: b.seed !== undefined && b.seed !== null && b.seed !== '' ? Math.round(num(b.seed, 0, 0, 4294967295)) : undefined,
  });

  let versaoId = null;
  if (b.gravar) {
    versaoId = transaction(() => {
      const m = resultado.metricas;
      const info = db
        .prepare(
          'INSERT INTO horario_versoes (periodo_id, seed, iteracoes, custo, metricas) VALUES (?, ?, ?, ?, ?)',
        )
        .run(periodoId, m.seed, m.iteracoes, m.custo, JSON.stringify(m));
      const ins = db.prepare(
        'INSERT INTO horario_aulas (versao_id, turma_id, disciplina_id, professor_id, dia, tempo) VALUES (?, ?, ?, ?, ?, ?)',
      );
      for (const a of resultado.aulas) {
        ins.run(info.lastInsertRowid, a.turma_id, a.disciplina_id, a.professor_id, a.dia, a.tempo);
      }
      return Number(info.lastInsertRowid);
    });
  }

  res.json({
    versao_id: versaoId,
    aulas: resultado.aulas,
    nao_colocadas: resultado.nao_colocadas,
    ignoradas,
    metricas: resultado.metricas,
    referencias: referencias(periodoId),
  });
});

// ---------- versões guardadas ----------
const SELECT_VERSAO = `
  SELECT v.id, v.periodo_id, p.nome AS periodo, v.estado, v.seed, v.custo, v.criado_em,
         (SELECT COUNT(DISTINCT turma_id) FROM horario_aulas WHERE versao_id = v.id) AS turmas,
         (SELECT COUNT(*) FROM horario_aulas WHERE versao_id = v.id) AS aulas
  FROM horario_versoes v JOIN periodos p ON p.id = v.periodo_id
`;

function detalheVersao(id) {
  const versao = db.prepare(`${SELECT_VERSAO} WHERE v.id = ?`).get(id);
  if (!versao) throw new HttpError(404, 'Versão não encontrada');
  const bruto = db.prepare('SELECT metricas FROM horario_versoes WHERE id = ?').get(id);
  const aulas = db
    .prepare(
      'SELECT turma_id, disciplina_id, professor_id, dia, tempo FROM horario_aulas WHERE versao_id = ? ORDER BY turma_id, dia, tempo',
    )
    .all(id);
  return {
    versao: { ...versao, metricas: JSON.parse(bruto.metricas) },
    aulas,
    referencias: referencias(versao.periodo_id),
  };
}

router.get('/versoes', (_req, res) => {
  res.json(db.prepare(`${SELECT_VERSAO} ORDER BY v.id DESC`).all());
});

router.get('/versoes/:id', (req, res) => {
  res.json(detalheVersao(parseId(req.params.id)));
});

// Publica a versão: fica "ativa" e a anterior ativa do mesmo período passa a "arquivado"
router.put('/versoes/:id/publicar', (req, res) => {
  const id = parseId(req.params.id);
  const v = db.prepare('SELECT periodo_id FROM horario_versoes WHERE id = ?').get(id);
  if (!v) throw new HttpError(404, 'Versão não encontrada');
  transaction(() => {
    db.prepare("UPDATE horario_versoes SET estado = 'arquivado' WHERE periodo_id = ? AND estado = 'ativo'").run(
      v.periodo_id,
    );
    db.prepare("UPDATE horario_versoes SET estado = 'ativo' WHERE id = ?").run(id);
  });
  res.json(detalheVersao(id));
});

// Move uma aula de uma turma para outro tempo (troca se o destino estiver ocupado)
router.put('/versoes/:id/mover', (req, res) => {
  const id = parseId(req.params.id);
  const turmaId = parseId(req.body?.turma_id);
  const { de, para } = req.body ?? {};
  const valido = (p) =>
    p && Number.isInteger(p.dia) && p.dia >= 1 && p.dia <= 5 && Number.isInteger(p.tempo) && p.tempo >= 1 && p.tempo <= 6;
  if (!valido(de) || !valido(para)) throw new HttpError(400, 'Tempos de origem/destino inválidos');

  const detalhe = detalheVersao(id);
  if (de.dia === para.dia && de.tempo === para.tempo) return res.json(detalhe);

  const { aulas, referencias: ref } = detalhe;
  const A = aulas.find((a) => a.turma_id === turmaId && a.dia === de.dia && a.tempo === de.tempo);
  if (!A) throw new HttpError(404, 'Não há aula no tempo de origem');
  const B = aulas.find((a) => a.turma_id === turmaId && a.dia === para.dia && a.tempo === para.tempo);

  const novas = [{ ...A, dia: para.dia, tempo: para.tempo }];
  if (B) novas.push({ ...B, dia: de.dia, tempo: de.tempo });

  const sala = (tid) => (ref.turmas[tid]?.sala ?? '').trim().toLowerCase();
  const rotulo = (tid) => {
    const t = ref.turmas[tid];
    return t ? `${t.classe}ª ${t.curso} ${t.nome}` : `turma ${tid}`;
  };
  const restantes = aulas.filter((a) => a !== A && a !== B);

  for (const n of novas) {
    const prof = restantes.find((a) => a.professor_id === n.professor_id && a.dia === n.dia && a.tempo === n.tempo);
    if (prof) {
      throw new HttpError(
        409,
        `${ref.professores[n.professor_id]} já tem aula nesse tempo (${rotulo(prof.turma_id)})`,
      );
    }
    const s = sala(n.turma_id);
    if (s) {
      const outra = restantes.find(
        (a) => a.turma_id !== n.turma_id && a.dia === n.dia && a.tempo === n.tempo && sala(a.turma_id) === s,
      );
      if (outra) {
        throw new HttpError(409, `A sala ${ref.turmas[n.turma_id].sala} já está ocupada nesse tempo (${rotulo(outra.turma_id)})`);
      }
    }
  }

  transaction(() => {
    const apagar = db.prepare(
      'DELETE FROM horario_aulas WHERE versao_id = ? AND turma_id = ? AND dia = ? AND tempo = ?',
    );
    apagar.run(id, turmaId, de.dia, de.tempo);
    if (B) apagar.run(id, turmaId, para.dia, para.tempo);
    const inserir = db.prepare(
      'INSERT INTO horario_aulas (versao_id, turma_id, disciplina_id, professor_id, dia, tempo) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const n of novas) inserir.run(id, n.turma_id, n.disciplina_id, n.professor_id, n.dia, n.tempo);
  });

  res.json(detalheVersao(id));
});

router.delete('/versoes/:id', (req, res) => {
  const info = db.prepare('DELETE FROM horario_versoes WHERE id = ?').run(parseId(req.params.id));
  if (!info.changes) throw new HttpError(404, 'Versão não encontrada');
  res.status(204).end();
});

export default router;