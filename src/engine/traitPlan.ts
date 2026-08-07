import { ALL_TRAIT_IDS } from '../domain/emblems';
import type { QualityTier, TraitId } from '../domain/emblems';
import type { Period } from '../domain/roles';
import type { StatId } from '../domain/stats';
import type { RoleUnit } from '../domain/roster';
import type { ScoringRuleSet } from '../domain/rules';
import { buildBanner } from './enumerate';
import { scoreBannerPerMap } from './scoreBanner';

/**
 * O melhor arranjo de TRACOS pro estandarte — por busca exaustiva.
 *
 * O espaco e minusculo (6 opcoes em 3 emblemas = 216), entao nao ha desculpa pra
 * decidir isso por argumento. E o argumento erra: a intuicao de "concentre o
 * multiplicador na melhor stat" so vale quando o emblema do meio tem base MUITO
 * maior que as pontas. Nos estandartes reais do TI as tres stats sao parecidas,
 * entao o bonus plano (triplo Amigavel, +50% em todos) bate a concentracao.
 *
 * CUIDADO DE ENQUADRAMENTO: isto e um ALVO DE REROLL, nao uma escolha. Traco vem
 * sorteado. Mostrar na tela como se fosse configuravel repetiria exatamente o
 * erro que o projeto inteiro existe pra corrigir.
 */
export interface TraitPlan {
  readonly traits: readonly TraitId[];
  /** Bonus final de cada emblema, em fracao (2,0 = +200%). */
  readonly bonuses: readonly number[];
  readonly score: number;
  /** Ganho sobre o pior arranjo possivel — o quanto o traco pesa nesta funcao. */
  readonly gainOverWorst: number;
  /** Melhor traco quando as tres qualidades saem TODAS DIFERENTES. */
  readonly whenDistinct: readonly TraitId[];
  /** Melhor traco quando duas ou mais qualidades se REPETEM. */
  readonly whenRepeated: readonly TraitId[];
}

/**
 * A recomendacao CONDICIONAL, que e o que serve na pratica.
 *
 * Qualidade vem sorteada, entao nao existe "o estandarte otimo" — existe o
 * otimo DADO O QUE CAIU. E a resposta vira, porque Fractal exige as tres
 * qualidades diferentes:
 *
 *   niveis todos diferentes  -> Fractal ganha (medido nos 216 arranjos)
 *   duas ou mais repetidas   -> Fractal vale ZERO, e Amigavel ganha
 *
 * Testar so no cenario "tudo Nivel V" esconde metade da resposta: la as tres
 * qualidades sao iguais por construcao e o Fractal nem pode ativar.
 */
export function conditionalTraitRule(
  unit: RoleUnit,
  statIds: readonly StatId[],
  period: Period,
  rules: ScoringRuleSet,
): { readonly distinct: readonly TraitId[]; readonly repeated: readonly TraitId[] } {
  const distinct = bestTraitPlan(unit, statIds, period, rules, [5, 4, 3]);
  const repeated = bestTraitPlan(unit, statIds, period, rules, [4, 4, 3]);
  return { distinct: distinct.traits, repeated: repeated.traits };
}

const CANDIDATE_TRAITS: readonly TraitId[] = [...ALL_TRAIT_IDS, 'none'];

export function bestTraitPlan(
  unit: RoleUnit,
  statIds: readonly StatId[],
  period: Period,
  rules: ScoringRuleSet,
  quality: QualityTier | readonly QualityTier[] = 5,
): TraitPlan {
  const tiers = Array.isArray(quality) ? quality : statIds.map(() => quality as QualityTier);
  const slotCount = statIds.length;
  let best: TraitPlan | null = null;
  let worst = Number.POSITIVE_INFINITY;

  const walk = (index: number, chosen: TraitId[]): void => {
    if (index === slotCount) {
      const banner = buildBanner(unit.slot, period, statIds, chosen.map((trait, i) => ({ quality: tiers[i], trait })));
      const scored = scoreBannerPerMap(banner, unit, rules);
      const score = scored.dist.mean;
      if (score < worst) worst = score;
      if (!best || score > best.score) {
        best = {
          traits: [...chosen],
          bonuses: scored.emblems.map((e) => e.multiplier - 1),
          score,
          gainOverWorst: 0,
          whenDistinct: [],
          whenRepeated: [],
        };
      }
      return;
    }
    for (const trait of CANDIDATE_TRAITS) {
      chosen.push(trait);
      walk(index + 1, chosen);
      chosen.pop();
    }
  };

  walk(0, []);

  const found = best as TraitPlan | null;
  if (!found) {
    return { traits: [], bonuses: [], score: 0, gainOverWorst: 0, whenDistinct: [], whenRepeated: [] };
  }
  return { ...found, gainOverWorst: worst > 0 ? found.score / worst - 1 : 0 };
}
