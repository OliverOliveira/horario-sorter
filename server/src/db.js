import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'

const dir = path.join(import.meta.dirname, '..', 'data')
fs.mkdirSync(dir, { recursive: true })

const db = new DatabaseSync(path.join(dir, 'horarios.db'))
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS periodos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE,
  intervalo_apos_tempo INTEGER NOT NULL DEFAULT 3
    CHECK (intervalo_apos_tempo BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS tempos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 6),
  hora_inicio TEXT NOT NULL,
  hora_fim TEXT NOT NULL,
  UNIQUE (periodo_id, numero)
);

CREATE TABLE IF NOT EXISTS disciplinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE,
  sigla TEXT
);

CREATE TABLE IF NOT EXISTS professores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  prioridade INTEGER NOT NULL DEFAULT 0 CHECK (prioridade >= 0)
);

CREATE TABLE IF NOT EXISTS professor_disciplinas (
  professor_id INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id),
  PRIMARY KEY (professor_id, disciplina_id)
);

CREATE TABLE IF NOT EXISTS professor_dias_preferenciais (
  professor_id INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 5),
  PRIMARY KEY (professor_id, dia_semana)
);

CREATE TABLE IF NOT EXISTS turmas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  classe TEXT NOT NULL,
  curso TEXT NOT NULL,
  area_formacao TEXT,
  sala TEXT,
  periodo_id INTEGER NOT NULL REFERENCES periodos(id),
  UNIQUE (classe, curso, nome)
);

CREATE TABLE IF NOT EXISTS atribuicoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  turma_id INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  disciplina_id INTEGER NOT NULL,
  professor_id INTEGER,
  tempos_semana INTEGER NOT NULL DEFAULT 1 CHECK (tempos_semana > 0),
  UNIQUE (turma_id, disciplina_id),
  FOREIGN KEY (professor_id, disciplina_id)
    REFERENCES professor_disciplinas (professor_id, disciplina_id)
);
`)

const colunasProfessores = db.prepare('PRAGMA table_info(professores)').all()
if (!colunasProfessores.some((c) => c.name === 'email')) {
  db.exec('ALTER TABLE professores ADD COLUMN email TEXT')
}

const colunasDisciplinas = db.prepare('PRAGMA table_info(disciplinas)').all().map((c) => c.name)
if (!colunasDisciplinas.includes('area_curricular')) {
  db.exec('ALTER TABLE disciplinas ADD COLUMN area_curricular TEXT')
}
if (!colunasDisciplinas.includes('carga_semanal')) {
  db.exec('ALTER TABLE disciplinas ADD COLUMN carga_semanal INTEGER NOT NULL DEFAULT 1')
}

const colunasTurmas = db.prepare('PRAGMA table_info(turmas)').all().map((c) => c.name)
if (!colunasTurmas.includes('alunos')) {
  db.exec('ALTER TABLE turmas ADD COLUMN alunos INTEGER')
}

// Migração: atribuicoes.professor_id passa a ser opcional
{
  const col = db
    .prepare('PRAGMA table_info(atribuicoes)')
    .all()
    .find((c) => c.name === 'professor_id');

  if (col && col.notnull === 1) {
    transaction(() => {
      db.exec(`
        CREATE TABLE atribuicoes_nova (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          turma_id INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
          disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id),
          professor_id INTEGER REFERENCES professores(id),
          tempos_semana INTEGER NOT NULL CHECK (tempos_semana > 0),
          UNIQUE (turma_id, disciplina_id),
          FOREIGN KEY (professor_id, disciplina_id)
            REFERENCES professor_disciplinas (professor_id, disciplina_id)
        );
        INSERT INTO atribuicoes_nova (id, turma_id, disciplina_id, professor_id, tempos_semana)
          SELECT id, turma_id, disciplina_id, professor_id, tempos_semana FROM atribuicoes;
        DROP TABLE atribuicoes;
        ALTER TABLE atribuicoes_nova RENAME TO atribuicoes;
      `);
    });
  }
}

db.exec(`
CREATE TABLE IF NOT EXISTS horario_versoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL REFERENCES periodos(id),
  estado TEXT NOT NULL DEFAULT 'rascunho',
  seed INTEGER NOT NULL,
  iteracoes INTEGER NOT NULL,
  custo REAL NOT NULL,
  metricas TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS horario_aulas (
  versao_id INTEGER NOT NULL REFERENCES horario_versoes(id) ON DELETE CASCADE,
  turma_id INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id),
  professor_id INTEGER NOT NULL REFERENCES professores(id),
  dia INTEGER NOT NULL CHECK (dia BETWEEN 1 AND 5),
  tempo INTEGER NOT NULL CHECK (tempo BETWEEN 1 AND 6),
  UNIQUE (versao_id, turma_id, dia, tempo)
);
`)

// Dados iniciais (só na primeira execução), com os tempos do PDF da manhã
const { n } = db.prepare('SELECT COUNT(*) AS n FROM periodos').get()
if (n === 0) {
  const manha = db.prepare('INSERT INTO periodos (nome) VALUES (?)').run('Manhã').lastInsertRowid
  db.prepare('INSERT INTO periodos (nome) VALUES (?)').run('Tarde')

  const insTempo = db.prepare(
    'INSERT INTO tempos (periodo_id, numero, hora_inicio, hora_fim) VALUES (?, ?, ?, ?)',
  )
  const tempos = [
    ['07:30', '08:15'],
    ['08:20', '09:05'],
    ['09:10', '09:55'],
    ['10:10', '10:55'],
    ['11:00', '11:55'],
    ['12:00', '12:35'],
  ]
  tempos.forEach(([ini, fim], i) => insTempo.run(manha, i + 1, ini, fim))
}

export function transaction(fn) {
  db.exec('BEGIN')
  try {
    const result = fn()
    db.exec('COMMIT')
    return result
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export default db