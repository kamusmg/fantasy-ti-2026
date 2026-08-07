import { createRng } from './math/rng';
import type { Rng } from './math/rng';

/**
 * Simulacao do Suico da Fase de Grupos do TI 2026 — o motor dos PALPITES.
 *
 * A estrutura e completamente determinada, e fecha exatamente com os baldes da
 * tela de Palpites:
 *
 *   R1  16 times, 8 partidas          -> 8 em 1-0, 8 em 0-1
 *   R2  8 partidas                    -> 4 em 2-0, 8 em 1-1, 4 em 0-2
 *   R3  8 partidas                    -> 2 em 3-0, 6 em 2-1, 6 em 1-2, 2 em 0-3
 *   R4  8 partidas                    -> 1 em 4-0 (fim), 4 em 3-1, 6 em 2-2,
 *                                        4 em 1-3, 1 em 0-4 (fim)
 *   R5  SETE partidas (o 4-0 e o 0-4 ja sairam)
 *                                     -> 2 em 4-1, 5 em 3-2, 5 em 2-3, 2 em 1-4
 *   Eliminatoria  os 5 de 3-2 contra os 5 de 2-3, 5 partidas
 *
 * As sete partidas da rodada 5 sao a confirmacao: e exatamente o que o wikitext
 * da Liquipedia mostra, e nenhuma outra estrutura produz esse numero.
 */

export type Bucket = '4-0' | '4-1' | 'elimWin' | 'elimLose' | '1-4' | '0-4';

export const BUCKET_ORDER: readonly Bucket[] = ['4-0', '4-1', 'elimWin', 'elimLose', '1-4', '0-4'];

export const BUCKET_LABEL_PT_BR: Readonly<Record<Bucket, string>> = {
  '4-0': '4 a 0',
  '4-1': '4 a 1',
  elimWin: 'Vencedora da Eliminatoria',
  elimLose: 'Perdedora da Eliminatoria',
  '1-4': '1 a 4',
  '0-4': '0 a 4',
};

/** Quantas vagas cada balde tem. Soma 16. */
export const BUCKET_SLOTS: Readonly<Record<Bucket, number>> = {
  '4-0': 1,
  '4-1': 2,
  elimWin: 5,
  elimLose: 5,
  '1-4': 2,
  '0-4': 1,
};

/** Series jogadas por balde — alimenta o melhor-de-K do fantasy. */
export const BUCKET_SERIES: Readonly<Record<Bucket, number>> = {
  '4-0': 4,
  '4-1': 5,
  elimWin: 6,
  elimLose: 6,
  '1-4': 5,
  '0-4': 4,
};

export interface TeamStrength {
  readonly teamId: string;
  /** Log-odds da probabilidade de titulo do mercado. Escala relativa. */
  readonly rating: number;
}

/**
 * Converte P(ganhar o TI) do mercado em rating.
 *
 * `temperature` e o unico parametro livre: controla o quanto a diferenca de
 * rating vira diferenca de vitoria. Nao da pra derivar do mercado sozinho, entao
 * e calibrado por um alvo interpretavel — a chance do melhor bater o pior numa
 * serie — e a sensibilidade a ele e reportada em vez de escondida.
 */
export function ratingsFromMarket(
  titleProbability: Readonly<Record<string, number>>,
): readonly TeamStrength[] {
  return Object.entries(titleProbability)
    .filter(([id]) => !id.startsWith('_'))
    .map(([teamId, p]) => ({ teamId, rating: Math.log(Math.max(p, 1e-6)) }));
}

/** Temperatura que faz o melhor bater o pior com a probabilidade alvo por serie. */
export function calibrateTemperature(ratings: readonly TeamStrength[], bestVsWorst: number): number {
  const sorted = [...ratings].sort((a, b) => b.rating - a.rating);
  const gap = sorted[0].rating - sorted[sorted.length - 1].rating;
  const logit = Math.log(bestVsWorst / (1 - bestVsWorst));
  return gap / logit;
}

function seriesWinProbability(a: TeamStrength, b: TeamStrength, temperature: number): number {
  return 1 / (1 + Math.exp(-(a.rating - b.rating) / temperature));
}

interface SimTeam {
  readonly index: number;
  wins: number;
  losses: number;
  bucket: Bucket | null;
}

/**
 * Emparelhamento dentro de um grupo de mesmo recorde, evitando revanche quando
 * possivel. A Valve usa uma semeadura propria que nao e publica; o efeito no
 * resultado agregado e pequeno, mas fica registrado como aproximacao.
 */
function pairGroup(group: readonly number[], played: readonly Set<number>[], rng: Rng): [number, number][] {
  const pool = [...group];
  // Embaralhamento de Fisher-Yates com o gerador semeado.
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const pairs: [number, number][] = [];
  while (pool.length >= 2) {
    const a = pool.shift() as number;
    let opponentIdx = pool.findIndex((b) => !played[a].has(b));
    if (opponentIdx === -1) opponentIdx = 0;
    const b = pool.splice(opponentIdx, 1)[0];
    pairs.push([a, b]);
  }
  return pairs;
}

export interface SwissResult {
  /** teamId -> balde -> probabilidade. */
  readonly bucketProbability: Readonly<Record<string, Readonly<Record<Bucket, number>>>>;
  /** teamId -> series esperadas na fase de grupos. */
  readonly expectedSeries: Readonly<Record<string, number>>;
  readonly iterations: number;
  readonly temperature: number;
}

export function simulateSwiss(
  ratings: readonly TeamStrength[],
  temperature: number,
  iterations = 50_000,
  seed = 20260813,
): SwissResult {
  const rng = createRng(seed);
  const counts: Record<string, Record<Bucket, number>> = {};
  for (const t of ratings) {
    counts[t.teamId] = { '4-0': 0, '4-1': 0, elimWin: 0, elimLose: 0, '1-4': 0, '0-4': 0 };
  }

  for (let iter = 0; iter < iterations; iter += 1) {
    const teams: SimTeam[] = ratings.map((_, index) => ({ index, wins: 0, losses: 0, bucket: null }));
    const played: Set<number>[] = ratings.map(() => new Set<number>());

    for (let round = 1; round <= 5; round += 1) {
      // Agrupa por recorde; quem ja fechou (4 vitorias ou 4 derrotas) esta fora.
      const groups = new Map<string, number[]>();
      for (const t of teams) {
        if (t.bucket !== null) continue;
        const key = `${t.wins}-${t.losses}`;
        const list = groups.get(key) ?? [];
        list.push(t.index);
        groups.set(key, list);
      }

      for (const group of groups.values()) {
        for (const [a, b] of pairGroup(group, played, rng)) {
          played[a].add(b);
          played[b].add(a);
          const aWins = rng.next() < seriesWinProbability(ratings[a], ratings[b], temperature);
          const winner = aWins ? a : b;
          const loser = aWins ? b : a;
          teams[winner].wins += 1;
          teams[loser].losses += 1;
        }
      }

      // Fecha quem chegou a 4 vitorias ou 4 derrotas.
      for (const t of teams) {
        if (t.bucket !== null) continue;
        if (t.wins === 4) t.bucket = t.losses === 0 ? '4-0' : '4-1';
        else if (t.losses === 4) t.bucket = t.wins === 0 ? '0-4' : '1-4';
      }
    }

    // Rodada eliminatoria: os 3-2 contra os 2-3.
    // O emparelhamento precisa ser SORTEADO. Casar por ordem de array faria a
    // ordem dos times no JSON virar sinal — vies silencioso e dificil de achar.
    const threeTwo = teams.filter((t) => t.bucket === null && t.wins === 3);
    const twoThree = teams.filter((t) => t.bucket === null && t.wins === 2);
    for (let i = twoThree.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng.next() * (i + 1));
      [twoThree[i], twoThree[j]] = [twoThree[j], twoThree[i]];
    }
    for (let i = 0; i < Math.min(threeTwo.length, twoThree.length); i += 1) {
      const a = threeTwo[i];
      const b = twoThree[i];
      const aWins = rng.next() < seriesWinProbability(ratings[a.index], ratings[b.index], temperature);
      a.bucket = aWins ? 'elimWin' : 'elimLose';
      b.bucket = aWins ? 'elimLose' : 'elimWin';
    }
    // Sobra impossivel na estrutura, mas nao deixamos virar silencio.
    for (const t of teams) {
      if (t.bucket === null) t.bucket = t.wins >= 3 ? 'elimWin' : 'elimLose';
    }

    for (const t of teams) counts[ratings[t.index].teamId][t.bucket as Bucket] += 1;
  }

  const bucketProbability: Record<string, Record<Bucket, number>> = {};
  const expectedSeries: Record<string, number> = {};
  for (const t of ratings) {
    const row = counts[t.teamId];
    const probs = {} as Record<Bucket, number>;
    let series = 0;
    for (const bucket of BUCKET_ORDER) {
      const p = row[bucket] / iterations;
      probs[bucket] = p;
      series += p * BUCKET_SERIES[bucket];
    }
    bucketProbability[t.teamId] = probs;
    expectedSeries[t.teamId] = series;
  }

  return { bucketProbability, expectedSeries, iterations, temperature, ...{} } as SwissResult;
}

/**
 * Escolhe QUAL time vai em QUAL vaga pra maximizar o numero esperado de acertos.
 *
 * Nao e "poe o mais provavel em cada balde": os baldes tem capacidade fixa e um
 * time so pode ocupar uma vaga, entao e um problema de ATRIBUICAO. Resolvido
 * exato pelo algoritmo hungaro numa matriz 16x16 (cada vaga de balde vira uma
 * coluna). Guloso erraria — daria o 4-0 pro favorito e depois ficaria sem bons
 * candidatos pros baldes vizinhos.
 */
export function assignPredictions(
  bucketProbability: Readonly<Record<string, Readonly<Record<Bucket, number>>>>,
): Readonly<Record<string, Bucket>> {
  const teamIds = Object.keys(bucketProbability);
  const slots: Bucket[] = [];
  for (const bucket of BUCKET_ORDER) {
    for (let i = 0; i < BUCKET_SLOTS[bucket]; i += 1) slots.push(bucket);
  }

  // Custo = -probabilidade (o hungaro minimiza).
  const cost = teamIds.map((teamId) => slots.map((bucket) => -bucketProbability[teamId][bucket]));
  const assignment = hungarian(cost);

  const out: Record<string, Bucket> = {};
  assignment.forEach((slotIndex, teamIndex) => {
    out[teamIds[teamIndex]] = slots[slotIndex];
  });
  return out;
}

/** Hungaro O(n^3), versao com potenciais (Jonker-Volgenant). Devolve coluna por linha. */
function hungarian(cost: readonly (readonly number[])[]): number[] {
  const n = cost.length;
  const m = cost[0].length;
  const INF = Number.POSITIVE_INFINITY;

  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(m + 1).fill(0);
  const p = new Array<number>(m + 1).fill(0);
  const way = new Array<number>(m + 1).fill(0);

  for (let i = 1; i <= n; i += 1) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array<number>(m + 1).fill(INF);
    const used = new Array<boolean>(m + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF;
      let j1 = 0;
      for (let j = 1; j <= m; j += 1) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= m; j += 1) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const result = new Array<number>(n).fill(-1);
  for (let j = 1; j <= m; j += 1) {
    if (p[j] > 0) result[p[j] - 1] = j - 1;
  }
  return result;
}
