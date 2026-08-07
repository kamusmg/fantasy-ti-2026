import { describe, expect, it } from 'vitest';
import {
  BUCKET_ORDER, BUCKET_SLOTS, assignPredictions, calibrateTemperature,
  ratingsFromMarket, simulateSwiss,
} from './swiss';
import type { Bucket } from './swiss';
import strength from '../data/raw/teamStrength.json';

const ratings = ratingsFromMarket(strength.polymarketTitleProbability);
const temperature = calibrateTemperature(ratings, 0.85);

describe('estrutura do Suico', () => {
  it('tem 16 times e as vagas somam 16', () => {
    expect(ratings).toHaveLength(16);
    expect(BUCKET_ORDER.reduce((a, b) => a + BUCKET_SLOTS[b], 0)).toBe(16);
  });

  /**
   * A prova de que a estrutura esta certa: com 16 times num Suico ate 4 vitorias,
   * o grupo dos invictos se parte pela metade a cada rodada (16-8-4-2-1), entao
   * sai EXATAMENTE um 4-0 e, por simetria, exatamente um 0-4. Se a simulacao
   * produzisse outra contagem, o formato estaria modelado errado e os Palpites
   * inteiros junto.
   */
  it('produz exatamente 1 time em 4-0, 2 em 4-1, 5+5 na eliminatoria, 2 em 1-4, 1 em 0-4', () => {
    const sim = simulateSwiss(ratings, temperature, 4000, 7);
    const expected: Record<Bucket, number> = { '4-0': 1, '4-1': 2, elimWin: 5, elimLose: 5, '1-4': 2, '0-4': 1 };

    for (const bucket of BUCKET_ORDER) {
      const total = Object.values(sim.bucketProbability).reduce((acc, row) => acc + row[bucket], 0);
      expect(total, `${bucket}: soma das probabilidades = ${total.toFixed(3)}`).toBeCloseTo(expected[bucket], 1);
    }
  });

  it('a probabilidade de cada time soma 1 entre os baldes', () => {
    const sim = simulateSwiss(ratings, temperature, 2000, 11);
    for (const [teamId, row] of Object.entries(sim.bucketProbability)) {
      const total = BUCKET_ORDER.reduce((acc, b) => acc + row[b], 0);
      expect(total, teamId).toBeCloseTo(1, 6);
    }
  });

  it('series esperadas ficam entre 4 e 6', () => {
    const sim = simulateSwiss(ratings, temperature, 2000, 13);
    for (const [teamId, series] of Object.entries(sim.expectedSeries)) {
      expect(series, teamId).toBeGreaterThanOrEqual(4);
      expect(series, teamId).toBeLessThanOrEqual(6);
    }
  });

  /** Time mais forte tem que ter mais chance de 4-0 e menos de 0-4. Sanidade basica. */
  it('o favorito supera o azarao nos dois extremos', () => {
    const sim = simulateSwiss(ratings, temperature, 8000, 17);
    expect(sim.bucketProbability.vision['4-0']).toBeGreaterThan(sim.bucketProbability.huligani['4-0']);
    expect(sim.bucketProbability.huligani['0-4']).toBeGreaterThan(sim.bucketProbability.vision['0-4']);
  });

  it('e deterministico: mesma semente, mesmo resultado', () => {
    const a = simulateSwiss(ratings, temperature, 1500, 42);
    const b = simulateSwiss(ratings, temperature, 1500, 42);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('atribuicao dos palpites', () => {
  const sim = simulateSwiss(ratings, temperature, 8000, 3);
  const picks = assignPredictions(sim.bucketProbability);

  it('preenche exatamente as vagas de cada balde, sem sobra nem falta', () => {
    const counts: Record<string, number> = {};
    for (const bucket of Object.values(picks)) counts[bucket] = (counts[bucket] ?? 0) + 1;
    for (const bucket of BUCKET_ORDER) expect(counts[bucket] ?? 0, bucket).toBe(BUCKET_SLOTS[bucket]);
  });

  it('cada time recebe exatamente uma vaga', () => {
    expect(Object.keys(picks)).toHaveLength(16);
  });

  /**
   * A atribuicao tem que bater um guloso. Guloso daria o 4-0 pro favorito e
   * depois ficaria sem candidato bom pros baldes vizinhos; o hungaro otimiza o
   * total. Se este teste falhar, o algoritmo esta errado.
   */
  /**
   * A prova forte de otimalidade: numa atribuicao otima NAO EXISTE troca de par
   * que melhore. Se existisse, bastaria fazer a troca e ficar melhor.
   *
   * Este teste nasceu de uma suspeita real: comparando com a ordem padrao do
   * cliente, ela colocava Yandex em 4-0 e VISION em 4-1, e nos o inverso — e a
   * dela parecia render 0,2 ponto a mais. Se o husgaro estivesse errado, a tela
   * inteira de Palpites estaria subotima.
   */
  it('nenhuma troca de par melhora a atribuicao', () => {
    const teamIds = Object.keys(picks);
    let bestImprovement = 0;
    let culprit = '';

    for (let i = 0; i < teamIds.length; i += 1) {
      for (let j = i + 1; j < teamIds.length; j += 1) {
        const a = teamIds[i];
        const b = teamIds[j];
        if (picks[a] === picks[b]) continue;
        const current = sim.bucketProbability[a][picks[a]] + sim.bucketProbability[b][picks[b]];
        const swapped = sim.bucketProbability[a][picks[b]] + sim.bucketProbability[b][picks[a]];
        if (swapped - current > bestImprovement) {
          bestImprovement = swapped - current;
          culprit = `${a}<->${b}: ${current.toFixed(4)} -> ${swapped.toFixed(4)}`;
        }
      }
    }

    expect(bestImprovement, `troca que melhora: ${culprit}`).toBeLessThan(1e-9);
  });

  it('nao perde pro guloso', () => {
    const hungarianHits = Object.entries(picks)
      .reduce((acc, [id, bucket]) => acc + sim.bucketProbability[id][bucket], 0);

    const remaining: Record<string, number> = { ...BUCKET_SLOTS };
    const taken = new Set<string>();
    let greedyHits = 0;
    const pairs = Object.entries(sim.bucketProbability)
      .flatMap(([id, row]) => BUCKET_ORDER.map((b) => ({ id, bucket: b, p: row[b] })))
      .sort((a, b) => b.p - a.p);
    for (const { id, bucket, p } of pairs) {
      if (taken.has(id) || remaining[bucket] <= 0) continue;
      taken.add(id);
      remaining[bucket] -= 1;
      greedyHits += p;
    }

    expect(hungarianHits).toBeGreaterThanOrEqual(greedyHits - 1e-9);
  });
});
