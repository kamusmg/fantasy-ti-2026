import type { StatId } from './stats';
import type { RoleSlot } from './roles';
import type { Banner } from './emblems';
import type { CoachTitle } from './titles';
import type { DataWarning, Estimate } from './estimate';

export interface ScoreDistribution {
  readonly mean: number;
  readonly sd: number;
  readonly p10: number;
  readonly p50: number;
  readonly p90: number;
}

export interface EmblemContribution {
  readonly index: number;
  readonly statId: StatId;
  readonly base: Estimate;
  /** Bonus da qualidade, em fracao (0,60 = Tier III). */
  readonly qualityBonus: number;
  /** Bonus do proprio traco, ja resolvido contra o estandarte inteiro. */
  readonly ownTraitBonus: number;
  /** Soma dos efeitos dos vizinhos (Benevolente +0,20, Vampirico -0,10). */
  readonly adjacencyBonus: number;
  /** Multiplicador final aplicado a base. */
  readonly multiplier: number;
  readonly total: number;
}

export interface RoleScoreBreakdown {
  readonly slot: RoleSlot;
  readonly teamId: string;
  readonly perMap: ScoreDistribution;
  /** Depois da regra dos 2 melhores mapas da serie. */
  readonly perSeries: ScoreDistribution;
  /** Depois da melhor-de-K series (ou soma, conforme a regra). */
  readonly perPeriod: ScoreDistribution;
  readonly emblems: readonly EmblemContribution[];
  readonly warnings: readonly DataWarning[];
}

export interface RoleAssignment {
  readonly teamId: string;
  readonly banner: Banner;
}

export interface Lineup {
  readonly core: RoleAssignment;
  readonly mid: RoleAssignment;
  readonly support: RoleAssignment;
  readonly title: CoachTitle;
}

export interface LineupScore {
  readonly lineup: Lineup;
  readonly perRole: Readonly<Record<RoleSlot, RoleScoreBreakdown>>;
  /** Total antes do titulo de treinador. */
  readonly baseTotal: ScoreDistribution;
  readonly titleGain: number;
  readonly total: ScoreDistribution;
  readonly warnings: readonly DataWarning[];
}

export function distributionFromMoments(mean: number, sd: number): ScoreDistribution {
  return {
    mean,
    sd,
    p10: mean - 1.2815515655446004 * sd,
    p50: mean,
    p90: mean + 1.2815515655446004 * sd,
  };
}

export function scaleDistribution(d: ScoreDistribution, factor: number): ScoreDistribution {
  return distributionFromMoments(d.mean * factor, d.sd * Math.abs(factor));
}

/** Soma de distribuicoes INDEPENDENTES. Nao usar onde houver correlacao. */
export function addIndependent(a: ScoreDistribution, b: ScoreDistribution): ScoreDistribution {
  return distributionFromMoments(a.mean + b.mean, Math.hypot(a.sd, b.sd));
}
