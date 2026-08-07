import type { ScoreDistribution } from '../domain/results';
import { distributionFromMoments } from '../domain/results';
import type { ScoringRuleSet } from '../domain/rules';
import { expectedMaxCoefficient, sdMaxCoefficient, topKSumCoefficients } from './math/orderStats';

/**
 * Agregacao por serie e por periodo — onde mora a correcao de ~30%.
 *
 * Somar medias, como o battlepass faz, subestima o periodo de forma sistematica.
 * Exemplo real: funcao com mu=3000 e sigma=900 por mapa.
 *   ingenuo (2 mapas):            6000
 *   com 2-melhores-de-3:          6762
 *   com melhor-de-5 series:       7945
 * +32%. Isso e maior que qualquer tier de qualidade, qualquer traco e o titulo
 * de treinador inteiro. E, pior que o erro no total, ele INVERTE o ranking entre
 * stats de alta e baixa variancia.
 */

export interface SeriesShape {
  /** P(a serie ter 2 mapas) e P(ter 3). Vem do modelo do Suico. */
  readonly mapCountDistribution: ReadonlyMap<2 | 3, number>;
}

export interface PeriodSchedule {
  /** P(o time jogar K series no periodo). Inclui K=0 = eliminado, que zera tudo. */
  readonly seriesCountDistribution: ReadonlyMap<number, number>;
}

/** Bo3 tipico da fase de grupos: sem informacao melhor, meio a meio. */
export const DEFAULT_SERIES_SHAPE: SeriesShape = {
  mapCountDistribution: new Map<2 | 3, number>([
    [2, 0.5],
    [3, 0.5],
  ]),
};

/**
 * Quantas SERIES cada faixa de classificacao joga na fase de grupos.
 *
 * Suico ate 4 vitorias ou 4 derrotas (5 rodadas, 39 series) mais uma rodada de
 * eliminacao com 5 series para os 10 times do meio. Conferido no wikitext da
 * Liquipedia: a rodada 5 tem SETE partidas, nao oito, porque o 4-0 e o 0-4 ja
 * estao resolvidos e ficam de fora.
 *
 * O detalhe que inverte a intuicao: sob MELHOR-DE-K, quem cai na eliminatoria
 * tira SEIS amostras e quem faz 4-0 tira so QUATRO. Mais series e uma OPCAO
 * gratuita. Ou seja, um time de meio de tabela pode valer mais que um favorito
 * que atropela o grupo — e nenhuma calculadora publica modela isso.
 */
export const GROUP_STAGE_SERIES_BY_BUCKET: Readonly<Record<string, { readonly series: number; readonly teams: number }>> = {
  '4-0': { series: 4, teams: 1 },
  '4-1': { series: 5, teams: 2 },
  eliminationRound: { series: 6, teams: 10 },
  '1-4': { series: 5, teams: 2 },
  '0-4': { series: 4, teams: 1 },
};

/**
 * Cronograma de um time MEDIO da fase de grupos, ponderado pelas 16 vagas.
 * E[K] = (1x4 + 2x5 + 10x6 + 2x5 + 1x4) / 16 = 5,5 series.
 *
 * Substituir pelo cronograma especifico do time quando a simulacao do Suico
 * entrar: quanto mais forte o time, MENOS series ele tende a jogar.
 */
export const GROUP_STAGE_SCHEDULE: PeriodSchedule = {
  seriesCountDistribution: new Map<number, number>([
    [4, 2 / 16],
    [5, 4 / 16],
    [6, 10 / 16],
  ]),
};

/** Cronograma da fase de grupos a partir de P(faixa) — alimentado pelo Suico. */
export function groupStageSchedule(bucketProbabilities: Readonly<Record<string, number>>): PeriodSchedule {
  const dist = new Map<number, number>();
  for (const [bucket, probability] of Object.entries(bucketProbabilities)) {
    const entry = GROUP_STAGE_SERIES_BY_BUCKET[bucket];
    if (!entry || probability <= 0) continue;
    dist.set(entry.series, (dist.get(entry.series) ?? 0) + probability);
  }
  return { seriesCountDistribution: dist };
}

function mixture(parts: readonly { readonly weight: number; readonly dist: ScoreDistribution }[]): ScoreDistribution {
  const totalWeight = parts.reduce((acc, p) => acc + p.weight, 0);
  if (totalWeight <= 0) return distributionFromMoments(0, 0);

  const mean = parts.reduce((acc, p) => acc + (p.weight / totalWeight) * p.dist.mean, 0);
  // Lei da variancia total: E[Var] + Var[E].
  const expectedVariance = parts.reduce((acc, p) => acc + (p.weight / totalWeight) * p.dist.sd ** 2, 0);
  const varianceOfMeans = parts.reduce(
    (acc, p) => acc + (p.weight / totalWeight) * (p.dist.mean - mean) ** 2,
    0,
  );
  return distributionFromMoments(mean, Math.sqrt(Math.max(0, expectedVariance + varianceOfMeans)));
}

/**
 * De mapa pra serie: guarda os 2 melhores mapas.
 *
 * Detalhe contra-intuitivo: uma varredura 2-0 tem MAIS variancia na soma guardada
 * (sqrt(2) sigma) do que uma serie de 3 mapas (1,13 sigma), porque a poda dos
 * 2-melhores-de-3 corta justamente a cauda ruim. Ou seja, P(serie de 3) empurra
 * o resultado em duas direcoes ao mesmo tempo: sobe a media, desce a variancia.
 */
export function aggregateSeries(
  perMap: ScoreDistribution,
  shape: SeriesShape,
  rules: ScoringRuleSet,
): ScoreDistribution {
  const parts: { weight: number; dist: ScoreDistribution }[] = [];

  for (const [mapCount, weight] of shape.mapCountDistribution) {
    if (weight <= 0) continue;
    const coef = topKSumCoefficients(rules.keepBestMapsPerSeries, mapCount);
    parts.push({
      weight,
      dist: distributionFromMoments(
        coef.meanCoef * perMap.mean + coef.sdCoef * perMap.sd,
        coef.sdOfSum * perMap.sd,
      ),
    });
  }

  return parts.length > 0 ? mixture(parts) : distributionFromMoments(0, 0);
}

/**
 * De serie pra periodo.
 *
 * Sob "melhor serie", E[max sobre K] cresce como sqrt(2 ln K): ir de 2 pra 4
 * series adiciona 0,47 sigma; de 4 pra 8, so 0,39. Corrida longa importa MUITO
 * menos do que parece. O que importa mesmo e P(K=0) — o risco de piso, quando o
 * time e eliminado e a funcao vale zero.
 *
 * Sob "soma das series" a historia inverte e volume vira linear. Por isso a
 * pergunta em aberto numero 1 e a que mais move a resposta.
 */
export function aggregatePeriod(
  perSeries: ScoreDistribution,
  schedule: PeriodSchedule,
  rules: ScoringRuleSet,
): ScoreDistribution {
  const parts: { weight: number; dist: ScoreDistribution }[] = [];

  for (const [seriesCount, weight] of schedule.seriesCountDistribution) {
    if (weight <= 0) continue;
    if (seriesCount <= 0) {
      parts.push({ weight, dist: distributionFromMoments(0, 0) });
      continue;
    }
    if (rules.periodAggregation === 'sumSeries') {
      parts.push({
        weight,
        dist: distributionFromMoments(seriesCount * perSeries.mean, Math.sqrt(seriesCount) * perSeries.sd),
      });
      continue;
    }
    parts.push({
      weight,
      dist: distributionFromMoments(
        perSeries.mean + expectedMaxCoefficient(seriesCount) * perSeries.sd,
        sdMaxCoefficient(seriesCount) * perSeries.sd,
      ),
    });
  }

  return parts.length > 0 ? mixture(parts) : distributionFromMoments(0, 0);
}
