/**
 * Engenharia reversa do modelo do battlepass.ru.
 *
 * Eles publicam quatro ganhos de titulo e a media da temporada. Encaixando:
 *
 *   ganho = bonus x BASE x P(condicao),   BASE = (2/3) x mediaDaTemporada
 *
 * as quatro probabilidades implicadas saem assim:
 *
 *   Clutch    0,16 -> +1071 -> P = 0,498   (exatamente 1 dos 2 mapas contados)
 *   Azarao    0,06 ->  +421 -> P = 0,522   (taxa de derrota)
 *   Sortudo   0,21 ->  +276 -> P = 0,098   (bate com o "~10%" que eles declaram)
 *   Ceruleo   0,11 ->  +478 -> P = 0,323   (taxa de heroi azul da liga)
 *
 * HONESTIDADE SOBRE O ENCAIXE: existe UM parametro de escala ajustado — o fator
 * 2/3, que nao consegui derivar da estrutura declarada (com 3 funcoes e 2 mapas
 * contados, esperava 2 ou 6, nao 2/3). O que sustenta o oraculo nao e o fator, e
 * o fato de que UMA constante explica QUATRO ganhos com probabilidades que batem
 * com quantidades conhecidas por fora: 0,5 exato pro Clutch, ~10% que eles mesmos
 * declaram pro Sortudo, e ~32% de heroi azul que a NOSSA tabela de frequencia,
 * de fonte totalmente diferente, tambem produz. Isso valida a ESTRUTURA relativa
 * e as probabilidades — que e justamente o que o motor consome.
 *
 * O motor de verdade nao usa esta constante em lugar nenhum: ele aplica o titulo
 * sobre o total que ele mesmo calcula. Isto aqui existe so pro teste-oraculo.
 */

export const BATTLEPASS_TITLE_BASE_FACTOR = 2 / 3;

export function battlepassTitleBase(seasonAverageRosterTotal: number): number {
  return BATTLEPASS_TITLE_BASE_FACTOR * seasonAverageRosterTotal;
}

export function battlepassTitleGain(
  bonus: number,
  probability: number,
  seasonAverageRosterTotal: number,
): number {
  return bonus * probability * battlepassTitleBase(seasonAverageRosterTotal);
}

/** Probabilidade que o ganho publicado implica, dado o bonus. Usado pra auditar. */
export function impliedProbability(
  gain: number,
  bonus: number,
  seasonAverageRosterTotal: number,
): number {
  return gain / (bonus * battlepassTitleBase(seasonAverageRosterTotal));
}
