import type { Banner } from '../domain/emblems';
import type { RoleUnit } from '../domain/roster';
import type { EmblemContribution, ScoreDistribution } from '../domain/results';
import { distributionFromMoments } from '../domain/results';
import type { ScoringRuleSet } from '../domain/rules';
import { emblemBonuses } from './multipliers';

export interface BannerScore {
  readonly dist: ScoreDistribution;
  readonly emblems: readonly EmblemContribution[];
}

/**
 * Pontuacao do estandarte POR MAPA, na escala da funcao.
 *
 * A media e linear: soma de (multiplicador x base). A variancia nao e — as stats
 * co-variam dentro do mesmo mapa (partida longa e dominada infla creeps, GPM,
 * abates e torres ao mesmo tempo). Essa correlacao e ASSUMIDA e mora em
 * rules.intraMapStatCorrelation.
 *
 *   sigma2 = SOMA mi2 sigmai2 + rho x SOMA_{i != j} mi mj sigmai sigmaj
 */
export function scoreBannerPerMap(banner: Banner, unit: RoleUnit, rules: ScoringRuleSet): BannerScore {
  const bonuses = emblemBonuses(banner.emblems, rules);

  const contributions: EmblemContribution[] = banner.emblems.map((emblem, i) => {
    const base = unit.perMapStat[emblem.statId];
    const multiplier = bonuses[i].multiplier;
    return {
      index: emblem.index,
      statId: emblem.statId,
      base,
      qualityBonus: bonuses[i].quality,
      ownTraitBonus: bonuses[i].ownTrait,
      adjacencyBonus: bonuses[i].adjacency,
      multiplier,
      total: base.mean * multiplier,
    };
  });

  const mean = contributions.reduce((acc, c) => acc + c.total, 0);

  const scaledSds = contributions.map((c, i) => bonuses[i].multiplier * c.base.sd);
  const independentVar = scaledSds.reduce((acc, sd) => acc + sd * sd, 0);
  let crossTerm = 0;
  for (let i = 0; i < scaledSds.length; i += 1) {
    for (let j = i + 1; j < scaledSds.length; j += 1) {
      crossTerm += 2 * scaledSds[i] * scaledSds[j];
    }
  }
  const variance = independentVar + rules.intraMapStatCorrelation * crossTerm;

  return {
    dist: distributionFromMoments(mean, Math.sqrt(Math.max(0, variance))),
    emblems: contributions,
  };
}
