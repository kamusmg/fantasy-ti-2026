import type { ScoreDistribution } from '../domain/results';
import { cdf, invCdf } from './math/normal';

/**
 * O que estamos maximizando.
 *
 * Sobre a curva de premio: ela e convexa em PERCENTIL, mas percentil e um eixo
 * comprimido. Compondo com a distribuicao do campo, ela vira CONCAVA em pontos —
 * subir do percentil 80 pro 90 rende ~5.900 pts por unidade de z, do 95 pro 100
 * rende ~1.500. O ganho marginal cai 4x conforme se sobe. Por Jensen, com media
 * fixa, MENOS variancia e melhor. E o contrario da intuicao.
 *
 * Contrapeso: a mecanica (2 melhores mapas, melhor serie) ja paga variancia
 * DENTRO da media, e esse canal e ~10x maior. Por isso o padrao e a media, com
 * a distribuicao exibida ao lado em vez de um escalar solitario.
 *
 * O que NAO da pra fazer com honestidade: calibrar a distribuicao do campo. Sem
 * ela nao existe conversao de pontos pra percentil. Por isso `expectedPayout`
 * nao existe aqui — seria confianca nao conquistada.
 */
export type Objective = (d: ScoreDistribution) => number;

export const expectedScore: Objective = (d) => d.mean;

export const quantileAt = (q: number): Objective => (d) => d.mean + invCdf(q) * d.sd;

/** Probabilidade de passar de um alvo. Util quando se sabe o corte do premio. */
export const probAbove = (target: number): Objective => (d) => {
  if (d.sd <= 0) return d.mean >= target ? 1 : 0;
  return 1 - cdf((target - d.mean) / d.sd);
};

export const OBJECTIVE_LABELS_PT_BR = {
  expected: 'Pontuacao esperada',
  conservative: 'Cenario ruim (p10)',
  aggressive: 'Cenario bom (p90)',
} as const;

export const CONSERVATIVE: Objective = quantileAt(0.10);
export const AGGRESSIVE: Objective = quantileAt(0.90);
