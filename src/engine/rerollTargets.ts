import { BANNER_LAYOUT } from '../domain/roles';
import type { Period, RoleSlot } from '../domain/roles';
import { STATS_BY_COLOR, STAT_DEFINITIONS } from '../domain/stats';
import type { EmblemColor, StatId } from '../domain/stats';
import type { RoleUnit } from '../domain/roster';
import { estimate } from '../domain/estimate';
import type { Estimate } from '../domain/estimate';

/**
 * PARA ONDE REROLAR.
 *
 * As stats do estandarte sao SORTEADAS, nao escolhidas — entao a pergunta util
 * nao e "qual build eu monto", e sim "o que eu ja tenho vale a pena, ou gasto
 * token pra trocar?". Isto aqui responde: pra cada cor de emblema daquela funcao,
 * o valor de cada stat possivel NAQUELE time, em ordem.
 *
 * As tabelas do Maroomm sao regras de PARADA, nao listas de escolha: dizem quando
 * o que saiu ja e bom o bastante pra parar de gastar token.
 */

export interface RerollTarget {
  readonly statId: StatId;
  readonly labelPtBr: string;
  readonly value: number;
  readonly estimate: Estimate;
  /** Perda em pontos ao ficar com esta stat em vez da melhor da cor. */
  readonly lossVsBest: number;
  /** Fracao do valor da melhor stat da cor. 1,0 = e a melhor. */
  readonly shareOfBest: number;
  readonly verdict: 'guardar' | 'aceitavel' | 'rerolar';
}

export interface ColorTargets {
  readonly color: EmblemColor;
  /** Quantos emblemas desta cor a funcao tem naquele periodo. */
  readonly emblemCount: number;
  readonly targets: readonly RerollTarget[];
}

/**
 * Limiares do veredito, em fracao do valor da melhor stat da cor.
 *
 * Sao regras de bolso e nao verdade medida — a distribuicao de resultado dos
 * rerolls nao e publicada por ninguem. O que sustenta os cortes: com 6 stats por
 * cor e reroll garantindo stat NOVA, trocar troca por uma media das outras cinco.
 * Se o que voce tem ja esta acima dessa media, trocar tem valor esperado negativo.
 */
const KEEP_THRESHOLD = 0.90;
const ACCEPTABLE_THRESHOLD = 0.72;

function verdictFor(share: number): RerollTarget['verdict'] {
  if (share >= KEEP_THRESHOLD) return 'guardar';
  if (share >= ACCEPTABLE_THRESHOLD) return 'aceitavel';
  return 'rerolar';
}

function buildTargets(
  slot: RoleSlot,
  period: Period,
  estimateOf: (statId: StatId) => Estimate,
): readonly ColorTargets[] {
  const colors = BANNER_LAYOUT[slot][period];
  const distinct = [...new Set(colors)];

  return distinct.map((color) => {
    const ranked = STATS_BY_COLOR[color]
      .map((statId) => ({ statId, estimate: estimateOf(statId) }))
      .sort((a, b) => b.estimate.mean - a.estimate.mean);

    const best = ranked[0]?.estimate.mean ?? 0;

    return {
      color,
      emblemCount: colors.filter((c) => c === color).length,
      targets: ranked.map(({ statId, estimate: est }) => {
        const share = best > 0 ? est.mean / best : 0;
        return {
          statId,
          labelPtBr: STAT_DEFINITIONS[statId].labelPtBr,
          value: est.mean,
          estimate: est,
          lossVsBest: best - est.mean,
          shareOfBest: share,
          verdict: verdictFor(share),
        };
      }),
    };
  });
}

/** Valor de cada stat de cada cor pro estandarte daquela funcao, naquele time. */
export function rerollTargets(unit: RoleUnit, period: Period): readonly ColorTargets[] {
  return buildTargets(unit.slot, period, (statId) => unit.perMapStat[statId]);
}

/**
 * O MESMO ranking, mas na MEDIA DA LIGA — sem time nenhum.
 *
 * Existe porque a tela abria travada na equipe recomendada, e uma equipe pode ser
 * atipica: no azul do Suporte a LGD e um dos dois times (de 16) em que Vigias
 * Ativados passa Sentinelas Posicionadas. Quem batia o olho lia "Vigias e o
 * melhor azul do Suporte", que e falso na liga e verdade so ali — e eu mesmo
 * repeti esse erro por escrito.
 *
 * Lei: quando a tela abre num CASO, ela ensina o caso como se fosse a regra. O
 * padrao tem que ser a regra, e o caso tem que ser escolhido de proposito.
 */
export function leagueTargets(
  slot: RoleSlot,
  period: Period,
  leagueMean: Readonly<Record<RoleSlot, Readonly<Record<StatId, number>>>>,
): readonly ColorTargets[] {
  return buildTargets(slot, period, (statId) =>
    estimate(leagueMean[slot][statId], 0, 'battlepass-ru', null, 0));
}

/**
 * Quantos atributos do TOPO estao empatados tecnicamente.
 *
 * Todo 'guardar' esta a menos de 10% do melhor da cor — dentro do erro do
 * proprio modelo. Mostrar 100% / 95% / 92% numa fila faz o primeiro parecer A
 * resposta, quando os tres sao a mesma resposta. Zero = nao ha empate.
 *
 * Como a lista vem ordenada e o veredito e monotono na fracao, os 'guardar' sao
 * sempre o prefixo da lista.
 */
export function tieCount(targets: ColorTargets): number {
  const n = targets.targets.filter((t) => t.verdict === 'guardar').length;
  return n >= 2 ? n : 0;
}

/**
 * O quanto a escolha de stat pesa naquela cor.
 *
 * Cor concentrada (uma stat domina) = vale gastar token. Cor achatada (todas
 * parecidas) = fique com o que veio e gaste os tokens em outro lugar. E o numero
 * que decide onde os 40 tokens rendem mais.
 */
export function colorConcentration(targets: ColorTargets): number {
  const values = targets.targets.map((t) => t.value);
  if (values.length < 2) return 0;
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  return values[0] / (total / values.length) - 1;
}
