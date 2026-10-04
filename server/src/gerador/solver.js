/**
 * Motor de geração de horários (construção gulosa por blocos + recozimento simulado).
 * Função pura: não acede à base de dados.
 *
 * Restrições duras (nunca violadas): um professor, uma turma e uma sala
 * só podem ter uma aula por (dia, tempo).
 *
 * Restrições suaves (custo):
 *  - blocos: os tempos de uma disciplina ficam seguidos, em blocos de no máximo 3;
 *    uma disciplina com 2 ou 3 tempos semanais fica num único bloco, e só é
 *    separada quando não há outra solução;
 *  - dias preferenciais (ponderados pela prioridade do professor);
 *  - janelas de professores e de turmas.
 */

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX_SEGUIDOS = 3;

const W_NAO_COLOCADA = 1000;
const W_SEGMENTO = 30; // por bloco a mais do que o necessário (ex.: 2 tempos em 2 blocos)
const W_BLOCO_LONGO = 30; // por tempo além de MAX_SEGUIDOS seguidos
const W_MESMO_DIA = 8; // dois blocos da mesma disciplina no mesmo dia, separados
const W_FORA_DIA = 3; // por aula fora dos dias preferenciais, × (1 + prioridade)
const W_DIA_USADO = 0.3; // cada dia em que o professor vem à escola
const W_JANELA_TURMA = 4;
const W_INICIO_TURMA = 0.4; // por tempo livre antes da primeira aula do dia

/** Divide n tempos em blocos de tamanho equilibrado, cada um com no máximo 3 (ex.: 5 → [3, 2]). */
function dividirEmBlocos(n) {
  const k = Math.ceil(n / MAX_SEGUIDOS);
  const base = Math.floor(n / k);
  const resto = n % k;
  return Array.from({ length: k }, (_, i) => base + (i < resto ? 1 : 0));
}

export function gerarHorario({
  turmas, // [{ id, sala }]
  aulas, // [{ turma_id, disciplina_id, professor_id, n }]
  professores, // [{ id, prioridade, dias: number[] }]  (dias 1..5; vazio = sem preferência)
  dias = 5,
  tempos = 6,
  iteracoes = 1000000,
  limiteMs = 30000,
  seed = Math.floor(Math.random() * 0xffffffff),
  pesoJanelas = 1.4,
}) {
  const inicio = Date.now();
  const rand = mulberry32(seed);
  const T = tempos;
  const S = dias * T;

  const turmaIdx = new Map(turmas.map((t, i) => [t.id, i]));
  const profIdx = new Map(professores.map((p, i) => [p.id, i]));
  const prof = professores.map((p) => ({
    id: p.id,
    prioridade: p.prioridade,
    pref: p.dias && p.dias.length ? new Set(p.dias) : null,
  }));

  const salaMap = new Map();
  const salaDe = turmas.map((t) => {
    const k = (t.sala ?? '').trim().toLowerCase();
    if (!k) return -1;
    if (!salaMap.has(k)) salaMap.set(k, salaMap.size);
    return salaMap.get(k);
  });

  const units = [];
  const grupos = []; // um grupo = todas as unidades de (turma, disciplina)
  const grupoDe = [];
  for (const a of aulas) {
    const ti = turmaIdx.get(a.turma_id);
    const pi = profIdx.get(a.professor_id);
    if (ti === undefined || pi === undefined) continue;
    const g = [];
    for (let k = 0; k < a.n; k++) {
      g.push(units.length);
      grupoDe[units.length] = g;
      units.push({ turma: ti, prof: pi, disc: a.disciplina_id, slot: -1 });
    }
    grupos.push(g);
  }

  const tOcc = turmas.map(() => new Int32Array(S).fill(-1));
  const pOcc = professores.map(() => new Int32Array(S).fill(-1));
  const sOcc = [...salaMap.keys()].map(() => new Int32Array(S).fill(-1));
  const porTurma = turmas.map(() => []);
  units.forEach((u, i) => porTurma[u.turma].push(i));

  const livre = (i, s) => {
    const u = units[i];
    return (
      tOcc[u.turma][s] === -1 &&
      pOcc[u.prof][s] === -1 &&
      (salaDe[u.turma] < 0 || sOcc[salaDe[u.turma]][s] === -1)
    );
  };
  const colocar = (i, s) => {
    const u = units[i];
    u.slot = s;
    tOcc[u.turma][s] = i;
    pOcc[u.prof][s] = i;
    if (salaDe[u.turma] >= 0) sOcc[salaDe[u.turma]][s] = i;
  };
  const retirar = (i) => {
    const u = units[i];
    const s = u.slot;
    if (s < 0) return;
    tOcc[u.turma][s] = -1;
    pOcc[u.prof][s] = -1;
    if (salaDe[u.turma] >= 0) sOcc[salaDe[u.turma]][s] = -1;
    u.slot = -1;
  };

  // ---------- custos ----------
  const rDisc = new Int32Array(S);
  const rLen = new Int32Array(S);
  const rDia = new Int32Array(S);
  const rVisto = new Uint8Array(S);
  const rIdx = new Int32Array(S);

  function custoTurma(ti) {
    let c = 0;
    const occ = tOcc[ti];
    let nr = 0;
    for (let d = 0; d < dias; d++) {
      let first = -1, last = -1, n = 0;
      let prevDisc = -1, prevT = -5;
      for (let t = 0; t < T; t++) {
        const u = occ[d * T + t];
        if (u < 0) continue;
        if (first < 0) first = t;
        last = t;
        n++;
        const disc = units[u].disc;
        if (disc === prevDisc && t === prevT + 1) {
          rLen[nr - 1]++;
        } else {
          rDisc[nr] = disc;
          rLen[nr] = 1;
          rDia[nr] = d;
          nr++;
        }
        prevDisc = disc;
        prevT = t;
      }
      if (n > 0) c += (last - first + 1 - n) * W_JANELA_TURMA + first * W_INICIO_TURMA;
    }

    // blocos por disciplina
    rVisto.fill(0, 0, nr);
    for (let i = 0; i < nr; i++) {
      if (rVisto[i]) continue;
      let total = 0, segs = 0, nIdx = 0, mesmoDia = 0;
      for (let j = i; j < nr; j++) {
        if (rDisc[j] !== rDisc[i]) continue;
        rVisto[j] = 1;
        total += rLen[j];
        segs++;
        if (rLen[j] > MAX_SEGUIDOS) c += (rLen[j] - MAX_SEGUIDOS) * W_BLOCO_LONGO;
        for (let k = 0; k < nIdx; k++) if (rDia[rIdx[k]] === rDia[j]) mesmoDia++;
        rIdx[nIdx++] = j;
      }
      c += Math.max(0, segs - Math.ceil(total / MAX_SEGUIDOS)) * W_SEGMENTO + mesmoDia * W_MESMO_DIA;
    }
    return c;
  }

  function custoProf(pi) {
    let c = 0;
    const occ = pOcc[pi];
    const p = prof[pi];
    for (let d = 0; d < dias; d++) {
      let first = -1, last = -1, n = 0;
      for (let t = 0; t < T; t++) {
        if (occ[d * T + t] >= 0) {
          if (first < 0) first = t;
          last = t;
          n++;
        }
      }
      if (n === 0) continue;
      c += W_DIA_USADO + (last - first + 1 - n) * pesoJanelas;
      if (p.pref && !p.pref.has(d + 1)) c += n * W_FORA_DIA * (1 + p.prioridade);
    }
    return c;
  }

  const custoTotal = () => {
    let c = 0;
    for (let i = 0; i < turmas.length; i++) c += custoTurma(i);
    for (let i = 0; i < prof.length; i++) c += custoProf(i);
    return c + units.filter((u) => u.slot < 0).length * W_NAO_COLOCADA;
  };

  /** Aplica movimentos [[unidade, slot]]; devolve { delta, desfazer } ou null se inviável. */
  function tentar(mov) {
    const afT = new Set();
    const afP = new Set();
    for (const [i] of mov) {
      afT.add(units[i].turma);
      afP.add(units[i].prof);
    }
    let antes = 0;
    for (const t of afT) antes += custoTurma(t);
    for (const p of afP) antes += custoProf(p);
    const antigos = mov.map(([i]) => units[i].slot);
    const naoAntes = antigos.filter((s) => s < 0).length;

    for (const [i] of mov) retirar(i);
    let ok = true;
    for (const [i, s] of mov) {
      if (!livre(i, s)) { ok = false; break; }
      colocar(i, s);
    }
    const desfazer = () => {
      for (const [i] of mov) retirar(i);
      mov.forEach(([i], k) => { if (antigos[k] >= 0) colocar(i, antigos[k]); });
    };
    if (!ok) {
      desfazer();
      return null;
    }
    let depois = 0;
    for (const t of afT) depois += custoTurma(t);
    for (const p of afP) depois += custoProf(p);
    return { delta: depois - antes - W_NAO_COLOCADA * naoAntes, desfazer };
  }

  /** Bloco seguido (mesma turma, disciplina e dia) a que a unidade pertence, por ordem de tempo. */
  function blocoDe(i) {
    const u = units[i];
    const d = Math.floor(u.slot / T);
    const t = u.slot % T;
    const occ = tOcc[u.turma];
    const mesmo = (tt) => tt >= 0 && tt < T && occ[d * T + tt] >= 0 && units[occ[d * T + tt]].disc === u.disc;
    let a = t;
    while (mesmo(a - 1)) a--;
    let b = t;
    while (mesmo(b + 1)) b++;
    const lista = [];
    for (let tt = a; tt <= b; tt++) lista.push(occ[d * T + tt]);
    return { dia: d, de: a, ate: b, unidades: lista };
  }

  // ---------- construção inicial: por grupos, em blocos seguidos ----------
  const cargaProf = new Array(prof.length).fill(0);
  units.forEach((u) => cargaProf[u.prof]++);
  const ordemGrupos = [...grupos].sort((a, b) => {
    const ua = units[a[0]], ub = units[b[0]];
    return (
      prof[ub.prof].prioridade - prof[ua.prof].prioridade ||
      cargaProf[ub.prof] - cargaProf[ua.prof] ||
      b.length - a.length ||
      ua.turma - ub.turma
    );
  });

  for (const g of ordemGrupos) {
    let k = 0;
    for (const tam of dividirEmBlocos(g.length)) {
      const bloco = g.slice(k, k + tam);
      k += tam;
      let melhor = null, melhorD = Infinity;
      for (let d = 0; d < dias; d++) {
        for (let t0 = 0; t0 + tam <= T; t0++) {
          const mov = bloco.map((u, j) => [u, d * T + t0 + j]);
          const r = tentar(mov);
          if (!r) continue;
          const delta = r.delta + rand() * 0.01;
          r.desfazer();
          if (delta < melhorD) { melhorD = delta; melhor = mov; }
        }
      }
      if (melhor) {
        for (const [u, s] of melhor) colocar(u, s);
      } else {
        // sem janela seguida disponível: separa, unidade a unidade
        for (const u of bloco) {
          let m = -1, md = Infinity;
          for (let s = 0; s < S; s++) {
            if (!livre(u, s)) continue;
            const r = tentar([[u, s]]);
            if (!r) continue;
            const delta = r.delta + rand() * 0.01;
            r.desfazer();
            if (delta < md) { md = delta; m = s; }
          }
          if (m >= 0) colocar(u, m);
        }
      }
    }
  }

  // ---------- recozimento simulado ----------
  let total = custoTotal();
  let melhorTotal = total;
  let melhorSlots = units.map((u) => u.slot);
  const T0 = 5, TF = 0.05;
  let it = 0;

  const escolheUnidade = () => {
    const nNao = units.reduce((n, u) => n + (u.slot < 0 ? 1 : 0), 0);
    if (nNao > 0 && rand() < 0.3) {
      let k = Math.floor(rand() * nNao);
      for (let i = 0; i < units.length; i++) if (units[i].slot < 0 && k-- === 0) return i;
    }
    return Math.floor(rand() * units.length);
  };

  if (units.length > 1) {
    for (; it < iteracoes; it++) {
      if (it % 500 === 0 && Date.now() - inicio > limiteMs) break;
      const temp = T0 * Math.pow(TF / T0, it / iteracoes);
      const u = escolheUnidade();
      const uu = units[u];
      const r = rand();
      let mov = null;

      if (r < 0.2) {
        // mover (ou trocar com a aula que ocupa o destino, na mesma turma)
        const s = Math.floor(rand() * S);
        if (s === uu.slot) continue;
        const v = tOcc[uu.turma][s];
        if (v === -1) mov = [[u, s]];
        else if (uu.slot >= 0) mov = [[u, s], [v, uu.slot]];
      } else if (r < 0.45) {
        // cadeia de ejeção: empurrar a aula que bloqueia o professor/sala
        const s = Math.floor(rand() * S);
        if (s === uu.slot || tOcc[uu.turma][s] !== -1) continue;
        const bp = pOcc[uu.prof][s];
        const bs = salaDe[uu.turma] >= 0 ? sOcc[salaDe[uu.turma]][s] : -1;
        const w = bp >= 0 ? bp : bs;
        if (w < 0 || (bp >= 0 && bs >= 0 && bp !== bs)) continue;
        const s2 = Math.floor(rand() * S);
        if (s2 === s) continue;
        if (tOcc[units[w].turma][s2] !== -1) continue;
        mov = [[w, s2], [u, s]];
      } else if (r < 0.55) {
        // trocar duas aulas da mesma turma
        const lista = porTurma[uu.turma];
        const v = lista[Math.floor(rand() * lista.length)];
        if (v === u || units[v].slot < 0 || uu.slot < 0) continue;
        mov = [[u, units[v].slot], [v, uu.slot]];
      } else {
        // mover um bloco seguido para uma janela (do mesmo tamanho) do mesmo ou de outro dia;
        // as aulas que ocupavam a janela passam para os tempos que o bloco libertou.
        if (uu.slot < 0) continue;
        const bloco = blocoDe(u);
        const L = bloco.unidades.length;
        if (L > T) continue;

        let dia, t0;
        const irmao = grupoDe[u].filter((x) => units[x].slot >= 0 && !bloco.unidades.includes(x));
        if (irmao.length > 0 && rand() < 0.6) {
          // aproximar-se de um bloco da mesma disciplina (juntar blocos separados)
          const alvo = blocoDe(irmao[Math.floor(rand() * irmao.length)]);
          dia = alvo.dia;
          t0 = rand() < 0.5 ? alvo.ate + 1 : alvo.de - L;
        } else {
          dia = Math.floor(rand() * dias);
          t0 = Math.floor(rand() * (T - L + 1));
        }
        if (t0 < 0 || t0 + L > T) continue;
        if (dia === bloco.dia && t0 === bloco.de) continue;

        const occ = tOcc[uu.turma];
        const deslocados = [];
        for (let j = 0; j < L; j++) {
          const v = occ[dia * T + t0 + j];
          if (v >= 0 && !bloco.unidades.includes(v)) deslocados.push(v);
        }
        const antigos = bloco.unidades.map((x) => units[x].slot);
        mov = bloco.unidades.map((x, j) => [x, dia * T + t0 + j]);
        deslocados.forEach((v, j) => mov.push([v, antigos[j]]));
      }
      if (!mov) continue;

      const res = tentar(mov);
      if (!res) continue;
      if (res.delta <= 0 || rand() < Math.exp(-res.delta / temp)) {
        total += res.delta;
        if (total < melhorTotal - 1e-9) {
          melhorTotal = total;
          melhorSlots = units.map((x) => x.slot);
        }
      } else {
        res.desfazer();
      }
    }
  }

  // restaurar a melhor solução encontrada
  units.forEach((_, i) => retirar(i));
  melhorSlots.forEach((s, i) => { if (s >= 0) colocar(i, s); });

  // ---------- resultado ----------
  const resultado = [];
  const faltas = new Map();
  units.forEach((u) => {
    if (u.slot >= 0) {
      resultado.push({
        turma_id: turmas[u.turma].id,
        disciplina_id: u.disc,
        professor_id: prof[u.prof].id,
        dia: Math.floor(u.slot / T) + 1,
        tempo: (u.slot % T) + 1,
      });
    } else {
      const k = `${u.turma}|${u.disc}|${u.prof}`;
      const e = faltas.get(k) ?? {
        turma_id: turmas[u.turma].id,
        disciplina_id: u.disc,
        professor_id: prof[u.prof].id,
        em_falta: 0,
      };
      e.em_falta++;
      faltas.set(k, e);
    }
  });

  let janelasProf = 0, janelasTurma = 0, foraDias = 0;
  for (let pi = 0; pi < prof.length; pi++) {
    for (let d = 0; d < dias; d++) {
      let first = -1, last = -1, n = 0;
      for (let t = 0; t < T; t++) {
        if (pOcc[pi][d * T + t] >= 0) { if (first < 0) first = t; last = t; n++; }
      }
      if (n) {
        janelasProf += last - first + 1 - n;
        if (prof[pi].pref && !prof[pi].pref.has(d + 1)) foraDias += n;
      }
    }
  }
  for (let ti = 0; ti < turmas.length; ti++) {
    for (let d = 0; d < dias; d++) {
      let first = -1, last = -1, n = 0;
      for (let t = 0; t < T; t++) {
        if (tOcc[ti][d * T + t] >= 0) { if (first < 0) first = t; last = t; n++; }
      }
      if (n) janelasTurma += last - first + 1 - n;
    }
  }

  // disciplinas com 2-3 tempos que ficaram separadas / blocos com mais de 3 seguidos
  let divididas = 0, blocosLongos = 0;
  for (const g of grupos) {
    const col = g.filter((i) => units[i].slot >= 0);
    if (col.length === 0) continue;
    const vistos = new Set();
    let blocos = 0;
    for (const i of col) {
      if (vistos.has(i)) continue;
      const b = blocoDe(i);
      b.unidades.forEach((x) => vistos.add(x));
      blocos++;
      if (b.unidades.length > MAX_SEGUIDOS) blocosLongos++;
    }
    if (col.length <= MAX_SEGUIDOS && blocos > 1) divididas++;
  }

  return {
    aulas: resultado,
    nao_colocadas: [...faltas.values()],
    metricas: {
      seed,
      iteracoes: it,
      iteracoes_pedidas: iteracoes,
      custo: Math.round(custoTotal() * 100) / 100,
      tempo_ms: Date.now() - inicio,
      total_aulas: units.length,
      colocadas: resultado.length,
      janelas_professores: janelasProf,
      janelas_turmas: janelasTurma,
      fora_dias_preferenciais: foraDias,
      disciplinas_divididas: divididas,
      blocos_longos: blocosLongos,
    },
  };
}