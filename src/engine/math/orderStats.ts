/**
 * Estatistica de ordem — a correcao que o battlepass.ru nao faz e que vale ~30%.
 *
 * As regras do fantasy tem DOIS operadores de selecao:
 *   1. contam as 2 melhores partidas de cada serie (uma Bo3 descarta o pior mapa)
 *   2. conta a melhor serie do periodo
 *
 * E[max] != max[E]. Somar medias subestima o periodo de forma sistematica, e o
 * tamanho do erro e proporcional a sigma — ou seja, tambem INVERTE o ranking
 * entre stats de alta e baixa variancia. Nao da pra ignorar.
 *
 * Um detalhe contra-intuitivo que cai daqui: um 2-0 tem MAIS variancia na soma
 * guardada do que um 2-1, porque a poda dos 2-melhores-de-3 corta a cauda ruim.
 * Entao P(serie de 3 mapas) empurra o resultado nas duas direcoes ao mesmo tempo.
 */

import { invCdf } from './normal';

/** E[maximo de K normais padrao]. Tabela exata ate 16; assintotico de Gumbel depois. */
const EXPECTED_MAX: readonly number[] = [
  0,        // K=1
  0.564190, // K=2  = 1/sqrt(pi)
  0.846284, // K=3
  1.029375,
  1.162964,
  1.267206,
  1.352178,
  1.423600,
  1.485013,
  1.538753,
  1.586437,
  1.629243,
  1.668051,
  1.703534,
  1.736219,
  1.766516, // K=16
];

/** Desvio padrao do maximo de K normais padrao. */
const SD_MAX: readonly number[] = [
  1.000000, // K=1
  0.825700,
  0.748000,
  0.701200,
  0.669000,
  0.644900,
  0.626000,
  0.610700,
  0.597900,
  0.586900,
  0.577400,
  0.569000,
  0.561500,
  0.554800,
  0.548700,
  0.543200, // K=16
];

function gumbelApproxMean(k: number): number {
  const l = Math.sqrt(2 * Math.log(k));
  return l - (Math.log(Math.log(k)) + Math.log(4 * Math.PI)) / (2 * l);
}

export function expectedMaxCoefficient(k: number): number {
  if (k <= 1) return 0;
  const idx = Math.floor(k) - 1;
  if (idx < EXPECTED_MAX.length) return EXPECTED_MAX[idx];
  return gumbelApproxMean(k);
}

export function sdMaxCoefficient(k: number): number {
  if (k <= 1) return 1;
  const idx = Math.floor(k) - 1;
  if (idx < SD_MAX.length) return SD_MAX[idx];
  // Gumbel: sd -> pi / (sqrt(6) * sqrt(2 ln k))
  return Math.PI / (Math.sqrt(6) * Math.sqrt(2 * Math.log(k)));
}

export interface TopKCoefficients {
  /** Coeficiente da media: E[soma dos k melhores] = meanCoef*mu + sdCoef*sigma. */
  readonly meanCoef: number;
  readonly sdCoef: number;
  /** Desvio padrao da SOMA guardada, em unidades de sigma. */
  readonly sdOfSum: number;
}

/**
 * Soma dos k melhores de n normais padrao.
 *
 * Casos que realmente acontecem no fantasy:
 *   k=2, n=2 (varredura 2-0): 2mu, sd = sqrt(2) sigma
 *   k=2, n=3 (serie de 3 mapas): 2mu + 0,8463 sigma, sd ~= 1,1305 sigma
 */
export function topKSumCoefficients(k: number, n: number): TopKCoefficients {
  if (k >= n) {
    return { meanCoef: n, sdCoef: 0, sdOfSum: Math.sqrt(n) };
  }
  if (k === 2 && n === 3) {
    // E[X(3)] + E[X(2)] = 0,846284 + 0 (a mediana de 3 tem media zero)
    return { meanCoef: 2, sdCoef: 0.846284, sdOfSum: 1.130500 };
  }
  if (k === 1) {
    return { meanCoef: 1, sdCoef: expectedMaxCoefficient(n), sdOfSum: sdMaxCoefficient(n) };
  }
  // Caso geral: aproximacao por soma das k maiores esperancas de ordem.
  let sdCoef = 0;
  for (let j = 0; j < k; j += 1) {
    sdCoef += expectedOrderStatistic(n - j, n);
  }
  return { meanCoef: k, sdCoef, sdOfSum: Math.sqrt(k) * 1.05 };
}

/**
 * E[i-esima menor de n normais padrao], via aproximacao de Blom.
 * Boa o bastante: so entra no caso geral, que nao ocorre nas regras atuais.
 */
function expectedOrderStatistic(i: number, n: number): number {
  const alpha = 0.375;
  return invCdf((i - alpha) / (n - 2 * alpha + 1));
}
