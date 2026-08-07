import { BANNER_LAYOUT } from '../domain/roles';
import type { Period, RoleSlot } from '../domain/roles';
import { STATS_BY_COLOR } from '../domain/stats';
import type { StatId } from '../domain/stats';
import type { Banner, Emblem, QualityTier, TraitId } from '../domain/emblems';
import type { ScoringRuleSet } from '../domain/rules';

/** Estado rolado de um emblema. No modo Planejamento, todos iguais e neutros. */
export interface EmblemRoll {
  readonly quality: QualityTier;
  readonly trait: TraitId;
}

/**
 * Estandarte de referencia do planejamento: tudo Tier III, sem tracos.
 *
 * Mesma convencao do battlepass, de proposito — assim os totais da tela sao
 * comparaveis com a calculadora deles lado a lado, ao vivo.
 */
export const PLANNING_ROLL: EmblemRoll = { quality: 3, trait: 'none' };

export function buildBanner(
  slot: RoleSlot,
  period: Period,
  statIds: readonly StatId[],
  rolls: readonly EmblemRoll[],
): Banner {
  const colors = BANNER_LAYOUT[slot][period];
  const emblems: Emblem[] = colors.map((color, index) => ({
    index,
    color,
    statId: statIds[index],
    quality: rolls[index].quality,
    trait: rolls[index].trait,
  }));
  return { slot, period, emblems };
}

export function planningRolls(slot: RoleSlot, period: Period): readonly EmblemRoll[] {
  return BANNER_LAYOUT[slot][period].map(() => PLANNING_ROLL);
}

/**
 * Todas as atribuicoes de stat validas pro estandarte daquela funcao.
 *
 * Espaco de busca da Fase de Grupos, sem stat repetida:
 *   Core R-G-R  -> 6x5 vermelhos ordenados x 6 verdes = 180
 *   Meio R-A-V  -> 6 x 6 x 6                          = 216
 *   Sup  A-V-A  -> 6x5 azuis ordenados x 6 verdes     = 180
 *
 * Forca bruta e o certo aqui: 180 nao pede heuristica, e um enumerador burro
 * continua correto se a regra sobre stat repetida mudar.
 *
 * Vale notar que, quando as qualidades ja estao roladas, existe um atalho exato
 * (desigualdade do rearranjo: casar o maior multiplicador com a maior base, ja
 * que o multiplicador do emblema NAO depende de qual stat esta nele). Nao usamos
 * o atalho — a forca bruta e barata e sobrevive a mudanca de regra.
 */
export function enumerateStatAssignments(
  slot: RoleSlot,
  period: Period,
  rules: ScoringRuleSet,
): readonly (readonly StatId[])[] {
  const colors = BANNER_LAYOUT[slot][period];
  const out: StatId[][] = [];
  const current: StatId[] = [];
  const used = new Set<StatId>();

  const recurse = (index: number): void => {
    if (index === colors.length) {
      out.push([...current]);
      return;
    }
    for (const statId of STATS_BY_COLOR[colors[index]]) {
      if (!rules.allowDuplicateStatsOnBanner && used.has(statId)) continue;
      current.push(statId);
      used.add(statId);
      recurse(index + 1);
      current.pop();
      used.delete(statId);
    }
  };

  recurse(0);
  return out;
}
