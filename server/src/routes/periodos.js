import { Router } from 'express';
import db, { transaction } from '../db.js';
import { HttpError, parseId } from '../http.js';

const router = Router();
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutos = (h) => {
  const [a, b] = h.split(':').map(Number);
  return a * 60 + b;
};

function carregar(id) {
  const p = db.prepare('SELECT id, nome, intervalo_apos_tempo FROM periodos WHERE id = ?').get(id);
  if (!p) return null;
  const tempos = db
    .prepare('SELECT numero, hora_inicio, hora_fim FROM tempos WHERE periodo_id = ? ORDER BY numero')
    .all(id);
  return { id: p.id, nome: p.nome, intervalo_apos_tempo: p.intervalo_apos_tempo, tempos };
}

function validarTempos(lista) {
  if (!Array.isArray(lista) || lista.length !== 6) {
    throw new HttpError(400, 'Envie exatamente 6 tempos');
  }
  const ordenados = [...lista].sort((a, b) => a.numero - b.numero);
  ordenados.forEach((t, i) => {
    if (t.numero !== i + 1) throw new HttpError(400, 'Os tempos devem ser numerados de 1 a 6');
    if (!HORA.test(String(t.hora_inicio)) || !HORA.test(String(t.hora_fim))) {
      throw new HttpError(400, `Tempo ${t.numero}: use o formato HH:MM`);
    }
    if (minutos(t.hora_fim) <= minutos(t.hora_inicio)) {
      throw new HttpError(400, `Tempo ${t.numero}: a saída deve ser depois da entrada`);
    }
    if (i > 0 && minutos(t.hora_inicio) < minutos(ordenados[i - 1].hora_fim)) {
      throw new HttpError(400, `Tempo ${t.numero} sobrepõe-se ao tempo ${t.numero - 1}`);
    }
  });
  return ordenados;
}

function gravar(id, body) {
  if (!carregar(id)) throw new HttpError(404, 'Período não encontrado');

  let intervalo = null;
  if (body.intervalo_apos_tempo !== undefined) {
    intervalo = Number(body.intervalo_apos_tempo);
    if (!Number.isInteger(intervalo) || intervalo < 1 || intervalo > 5) {
      throw new HttpError(400, 'O intervalo deve ficar entre os tempos 1 e 5');
    }
  }
  const tempos = body.tempos !== undefined ? validarTempos(body.tempos) : null;

  transaction(() => {
    if (intervalo !== null) {
      db.prepare('UPDATE periodos SET intervalo_apos_tempo = ? WHERE id = ?').run(intervalo, id);
    }
    if (tempos) {
      const upsert = db.prepare(`
        INSERT INTO tempos (periodo_id, numero, hora_inicio, hora_fim) VALUES (?, ?, ?, ?)
        ON CONFLICT (periodo_id, numero)
        DO UPDATE SET hora_inicio = excluded.hora_inicio, hora_fim = excluded.hora_fim
      `);
      for (const t of tempos) upsert.run(id, t.numero, t.hora_inicio, t.hora_fim);
    }
  });
  return carregar(id);
}

router.get('/', (_req, res) => {
  const ids = db.prepare('SELECT id FROM periodos ORDER BY id').all();
  res.json(ids.map((r) => carregar(r.id)));
});

router.get('/:id', (req, res) => {
  const p = carregar(parseId(req.params.id));
  if (!p) throw new HttpError(404, 'Período não encontrado');
  res.json(p);
});

// Grava intervalo e/ou os 6 tempos de uma só vez
router.put('/:id', (req, res) => {
  res.json(gravar(parseId(req.params.id), req.body ?? {}));
});

// Compatibilidade: só os tempos
router.put('/:id/tempos', (req, res) => {
  res.json(gravar(parseId(req.params.id), { tempos: req.body?.tempos }));
});

export default router;