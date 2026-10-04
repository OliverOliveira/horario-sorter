import { Router } from 'express';
import db, { transaction } from '../db.js';
import { HttpError, parseId } from '../http.js';

const router = Router();

const SELECT = `
  SELECT a.id, a.tempos_semana,
         a.turma_id,
         t.classe || 'ª ' || t.curso || ' ' || t.nome AS turma,
         a.disciplina_id, d.nome AS disciplina, d.sigla, d.area_curricular,
         a.professor_id, p.nome AS professor
  FROM atribuicoes a
  JOIN turmas t ON t.id = a.turma_id
  JOIN disciplinas d ON d.id = a.disciplina_id
  LEFT JOIN professores p ON p.id = a.professor_id
`;

const CAPACIDADE = (alias) =>
  `(SELECT COUNT(*) FROM tempos WHERE periodo_id = ${alias}.periodo_id) * 5`;

function leciona(professorId, disciplinaId) {
  return !!db
    .prepare('SELECT 1 FROM professor_disciplinas WHERE professor_id = ? AND disciplina_id = ?')
    .get(professorId, disciplinaId);
}

function opcionalId(v, campo) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `${campo} inválido`);
  return n;
}

function tempos(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 30) {
    throw new HttpError(400, 'Tempos por semana deve estar entre 1 e 30');
  }
  return n;
}

function verificarProfessor(professorId, disciplinaId) {
  if (professorId !== null && !leciona(professorId, disciplinaId)) {
    throw new HttpError(422, 'O professor não leciona esta disciplina');
  }
}

// ---------- listagem (filtros opcionais) ----------
router.get('/', (req, res) => {
  const where = [];
  const params = [];
  if (req.query.turma_id) { where.push('a.turma_id = ?'); params.push(parseId(req.query.turma_id)); }
  if (req.query.professor_id) { where.push('a.professor_id = ?'); params.push(parseId(req.query.professor_id)); }
  const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY t.classe, t.curso, t.nome, d.nome`;
  res.json(db.prepare(sql).all(...params));
});

// ---------- professores que lecionam cada disciplina ----------
router.get('/candidatos', (_req, res) => {
  const rows = db.prepare(`
    SELECT pd.disciplina_id, p.id AS professor_id, p.nome, p.prioridade,
           (SELECT group_concat(dia_semana) FROM professor_dias_preferenciais WHERE professor_id = p.id) AS dias
    FROM professor_disciplinas pd
    JOIN professores p ON p.id = pd.professor_id
    ORDER BY p.nome
  `).all();
  res.json(
    rows.map((r) => ({
      ...r,
      dias: r.dias ? r.dias.split(',').map(Number).sort() : [],
    })),
  );
});

// ---------- incompatibilidades ----------
router.get('/incompatibilidades', (_req, res) => {
  const turmas = db.prepare(`
    SELECT t.id, t.classe || 'ª ' || t.curso || ' ' || t.nome AS nome,
           SUM(a.tempos_semana) AS total, ${CAPACIDADE('t')} AS capacidade
    FROM turmas t JOIN atribuicoes a ON a.turma_id = t.id
    GROUP BY t.id HAVING total > capacidade
  `).all();

  const professores = db.prepare(`
    SELECT p.id, p.nome, pe.nome AS periodo,
           SUM(a.tempos_semana) AS total, ${CAPACIDADE('t')} AS capacidade
    FROM atribuicoes a
    JOIN professores p ON p.id = a.professor_id
    JOIN turmas t ON t.id = a.turma_id
    JOIN periodos pe ON pe.id = t.periodo_id
    GROUP BY p.id, t.periodo_id HAVING total > capacidade
  `).all();

  res.json({ turmas, professores });
});

// ---------- matriz de uma turma ----------
function matrizDaTurma(turmaId) {
  const turma = db.prepare(`
    SELECT t.id, t.nome, t.classe, t.curso, t.sala, t.alunos, t.periodo_id,
           pe.nome AS periodo, ${CAPACIDADE('t')} AS capacidade
    FROM turmas t JOIN periodos pe ON pe.id = t.periodo_id
    WHERE t.id = ?
  `).get(turmaId);
  if (!turma) throw new HttpError(404, 'Turma não encontrada');

  const linhas = db.prepare(`${SELECT} WHERE a.turma_id = ? ORDER BY d.nome`).all(turmaId);
  const disciplinas = db
    .prepare('SELECT id, nome, sigla, area_curricular, carga_semanal FROM disciplinas ORDER BY nome')
    .all();
  return { turma, linhas, disciplinas };
}

router.get('/turma/:turmaId', (req, res) => {
  res.json(matrizDaTurma(parseId(req.params.turmaId)));
});

// Grava a matriz inteira da turma (substitui o conjunto de disciplinas)
router.put('/turma/:turmaId', (req, res) => {
  const turmaId = parseId(req.params.turmaId);
  if (!db.prepare('SELECT 1 FROM turmas WHERE id = ?').get(turmaId)) {
    throw new HttpError(404, 'Turma não encontrada');
  }
  const lista = req.body?.atribuicoes;
  if (!Array.isArray(lista)) throw new HttpError(400, 'Envie a lista "atribuicoes"');

  const vistas = new Set();
  const itens = lista.map((l) => {
    const disciplinaId = parseId(l.disciplina_id);
    if (vistas.has(disciplinaId)) throw new HttpError(400, 'Disciplina repetida na matriz');
    vistas.add(disciplinaId);
    const professorId = opcionalId(l.professor_id, 'Professor');
    verificarProfessor(professorId, disciplinaId);
    return { disciplinaId, professorId, tempos: tempos(l.tempos_semana) };
  });

  transaction(() => {
    const existentes = db
      .prepare('SELECT disciplina_id FROM atribuicoes WHERE turma_id = ?')
      .all(turmaId)
      .map((r) => r.disciplina_id);
    const apagar = db.prepare('DELETE FROM atribuicoes WHERE turma_id = ? AND disciplina_id = ?');
    for (const d of existentes) if (!vistas.has(d)) apagar.run(turmaId, d);

    const upsert = db.prepare(`
      INSERT INTO atribuicoes (turma_id, disciplina_id, professor_id, tempos_semana)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (turma_id, disciplina_id)
      DO UPDATE SET professor_id = excluded.professor_id, tempos_semana = excluded.tempos_semana
    `);
    for (const i of itens) upsert.run(turmaId, i.disciplinaId, i.professorId, i.tempos);
  });

  res.json(matrizDaTurma(turmaId));
});

// ---------- CRUD individual (mantido) ----------
router.post('/', (req, res) => {
  const turmaId = parseId(req.body.turma_id);
  const disciplinaId = parseId(req.body.disciplina_id);
  const professorId = opcionalId(req.body.professor_id, 'Professor');
  verificarProfessor(professorId, disciplinaId);
  const info = db
    .prepare('INSERT INTO atribuicoes (turma_id, disciplina_id, professor_id, tempos_semana) VALUES (?, ?, ?, ?)')
    .run(turmaId, disciplinaId, professorId, tempos(req.body.tempos_semana));
  res.status(201).json(db.prepare(`${SELECT} WHERE a.id = ?`).get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const id = parseId(req.params.id);
  const atual = db.prepare('SELECT * FROM atribuicoes WHERE id = ?').get(id);
  if (!atual) throw new HttpError(404, 'Atribuição não encontrada');
  const professorId = 'professor_id' in req.body ? opcionalId(req.body.professor_id, 'Professor') : atual.professor_id;
  const t = 'tempos_semana' in req.body ? tempos(req.body.tempos_semana) : atual.tempos_semana;
  verificarProfessor(professorId, atual.disciplina_id);
  db.prepare('UPDATE atribuicoes SET professor_id = ?, tempos_semana = ? WHERE id = ?').run(professorId, t, id);
  res.json(db.prepare(`${SELECT} WHERE a.id = ?`).get(id));
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM atribuicoes WHERE id = ?').run(parseId(req.params.id));
  if (!info.changes) throw new HttpError(404, 'Atribuição não encontrada');
  res.status(204).end();
});

export default router;