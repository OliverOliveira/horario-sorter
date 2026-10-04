import { Router } from 'express'
import db, { transaction } from '../db.js'
import { HttpError, intList, optionalText, parseId, requireText } from '../http.js'

const router = Router()

function obter(id) {
  const prof = db.prepare('SELECT * FROM professores WHERE id = ?').get(id)
  if (!prof) throw new HttpError(404, 'Professor não encontrado')
  return montar(prof)
}

function montar(prof) {
  const disciplinas = db
    .prepare(
      `SELECT d.id, d.nome, d.sigla
         FROM professor_disciplinas pd
         JOIN disciplinas d ON d.id = pd.disciplina_id
        WHERE pd.professor_id = ?
        ORDER BY d.nome`,
    )
    .all(prof.id)
  const dias = db
    .prepare(
      'SELECT dia_semana FROM professor_dias_preferenciais WHERE professor_id = ? ORDER BY dia_semana',
    )
    .all(prof.id)
    .map((r) => r.dia_semana)
  return { ...prof, disciplinas, dias_preferenciais: dias }
}

function lerCorpo(body = {}) {
  const prioridade = body.prioridade === undefined ? 0 : Number(body.prioridade)
  if (!Number.isInteger(prioridade) || prioridade < 0) {
    throw new HttpError(400, 'prioridade deve ser um inteiro maior ou igual a 0')
  }
  return {
    nome: requireText(body.nome, 'nome'),
    prioridade,
    disciplinaIds: intList(body.disciplina_ids, 'disciplina_ids'),
    dias: intList(body.dias_preferenciais, 'dias_preferenciais', { min: 1, max: 5 }),
    nome: requireText(body.nome, 'nome'),
    email: optionalText(body.email),
  }
}

function sincronizar(profId, disciplinaIds, dias) {
  // Disciplinas: só remove/insere a diferença, porque atribuições dependem delas
  const atuais = db
    .prepare('SELECT disciplina_id FROM professor_disciplinas WHERE professor_id = ?')
    .all(profId)
    .map((r) => r.disciplina_id)
  const novas = new Set(disciplinaIds)

  const remover = db.prepare(
    'DELETE FROM professor_disciplinas WHERE professor_id = ? AND disciplina_id = ?',
  )
  for (const id of atuais) if (!novas.has(id)) remover.run(profId, id)

  const inserir = db.prepare(
    'INSERT INTO professor_disciplinas (professor_id, disciplina_id) VALUES (?, ?)',
  )
  for (const id of novas) if (!atuais.includes(id)) inserir.run(profId, id)

  // Dias preferenciais: substitui tudo
  db.prepare('DELETE FROM professor_dias_preferenciais WHERE professor_id = ?').run(profId)
  const insDia = db.prepare(
    'INSERT INTO professor_dias_preferenciais (professor_id, dia_semana) VALUES (?, ?)',
  )
  for (const d of dias) insDia.run(profId, d)
}

router.get('/', (_req, res) => {
  const lista = db.prepare('SELECT * FROM professores ORDER BY nome').all()
  res.json(lista.map(montar))
})

router.get('/:id', (req, res) => {
  res.json(obter(parseId(req.params.id)))
})

router.post('/', (req, res) => {
  const { nome, email, prioridade, disciplinaIds, dias } = lerCorpo(req.body)
  const id = transaction(() => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO professores (nome, email, prioridade) VALUES (?, ?, ?)')
      .run(nome, email, prioridade)
    sincronizar(lastInsertRowid, disciplinaIds, dias)
    return lastInsertRowid
  })
  res.status(201).json(obter(id))
})

router.put('/:id', (req, res) => {
  const id = parseId(req.params.id)
  obter(id)
  const { nome, email, prioridade, disciplinaIds, dias } = lerCorpo(req.body)
  transaction(() => {
    db.prepare('UPDATE professores SET nome = ?, email = ?, prioridade = ? WHERE id = ?').run(
      nome, email, prioridade, id,
    )
    sincronizar(id, disciplinaIds, dias)
  })
  res.json(obter(id))
})

router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id)
  obter(id)
  db.prepare('DELETE FROM professores WHERE id = ?').run(id)
  res.status(204).end()
})

export default router