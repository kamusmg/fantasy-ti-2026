import { ALL_ROLE_SLOTS, byRoleSlot, playersInRole } from '../domain/roles';
import type { Period, RoleSlot } from '../domain/roles';
import type { StatId } from '../domain/stats';
import type { Banner } from '../domain/emblems';
import type { ScoreDistribution } from '../domain/results';
import { distributionFromMoments } from '../domain/results';
import type { ScoringRuleSet } from '../domain/rules';
import { ALL_PREFIX_IDS, ALL_SUFFIX_IDS, PREFIX_DEFINITIONS, SUFFIX_DEFINITIONS } from '../domain/titles';
import type { CoachTitle, SuffixId } from '../domain/titles';
import type { Player, RoleUnit } from '../domain/roster';
import { roleUnitKey } from '../domain/roster';
import type { DataWarning } from '../domain/estimate';
import type { EmblemContribution } from '../domain/results';

import { aggregatePeriod, aggregateSeries } from './aggregate';
import type { PeriodSchedule, SeriesShape } from './aggregate';
import { buildBanner, enumerateStatAssignments } from './enumerate';
import type { EmblemRoll } from './enumerate';
import { scoreBannerPerMap } from './scoreBanner';
import { prefixProbability } from './coach';
import type { TitleContext } from './coach';
import type { Objective } from './objectives';
import { expectedScore } from './objectives';

export interface EngineContext {
  readonly roleUnits: ReadonlyMap<string, RoleUnit>;
  readonly players: ReadonlyMap<string, Player>;
  readonly teamIds: readonly string[];
  readonly rules: ScoringRuleSet;
  readonly period: Period;
  readonly seriesShape: SeriesShape;
  readonly schedule: Readonly<Record<RoleSlot, PeriodSchedule>>;
  readonly titleContext: TitleContext;
  /** Estado rolado dos emblemas por funcao. No Planejamento, tudo Tier III sem traco. */
  readonly rolls: Readonly<Record<RoleSlot, readonly EmblemRoll[]>>;
}

export interface RoleCandidate {
  readonly slot: RoleSlot;
  readonly teamId: string;
  readonly statIds: readonly StatId[];
  readonly banner: Banner;
  readonly perMap: ScoreDistribution;
  readonly perSeries: ScoreDistribution;
  readonly perPeriod: ScoreDistribution;
  readonly emblems: readonly EmblemContribution[];
  readonly warnings: readonly DataWarning[];
}

/**
 * Passo 1 — pontuar TODOS os candidatos (time x atribuicao de stats) por funcao.
 *
 * A observacao que faz o otimizador ser barato: a nota de um par (time, estandarte)
 * NAO depende do titulo de treinador. O titulo so entra depois, como um fator
 * linear sobre a nota. Entao pontua-se 9.216 candidatos uma unica vez e as 64
 * combinacoes de titulo viram aritmetica em cima do resultado — em vez de 590 mil
 * reavaliacoes.
 */
export function evaluateRoleCandidates(ctx: EngineContext): Readonly<Record<RoleSlot, readonly RoleCandidate[]>> {
  return byRoleSlot<readonly RoleCandidate[]>((slot) => {
    const assignments = enumerateStatAssignments(slot, ctx.period, ctx.rules);
    const rolls = ctx.rolls[slot];
    const schedule = ctx.schedule[slot];
    const candidates: RoleCandidate[] = [];

    for (const teamId of ctx.teamIds) {
      const unit = ctx.roleUnits.get(roleUnitKey(teamId, slot));
      if (!unit) continue;

      for (const statIds of assignments) {
        const banner = buildBanner(slot, ctx.period, statIds, rolls);
        const scored = scoreBannerPerMap(banner, unit, ctx.rules);
        const perSeries = aggregateSeries(scored.dist, ctx.seriesShape, ctx.rules);
        const perPeriod = aggregatePeriod(perSeries, schedule, ctx.rules);
        candidates.push({
          slot,
          teamId,
          statIds,
          banner,
          perMap: scored.dist,
          perSeries,
          perPeriod,
          emblems: scored.emblems,
          warnings: unit.warnings,
        });
      }
    }

    return candidates;
  });
}

/**
 * Fator do prefixo por (funcao, time). Depende so de QUEM joga, nunca de qual
 * stat esta no emblema — por isso da pra pre-computar.
 *
 * fator = bonus x (1/|jogadores|) x SOMA_jogador P(condicao | jogador)
 *
 * O 1/|jogadores| e o detalhe que quase todo mundo erra: a nota da funcao e a
 * MEDIA dos jogadores, entao o Meio (sozinho) pesa 1/3 e cada jogador de dupla
 * pesa 1/6. Media simples pelos 5 subestimaria o Meio em 40%.
 */
export function prefixFactorByTeam(ctx: EngineContext): Readonly<Record<string, number>> {
  const out: Record<string, number> = {};

  for (const slot of ALL_ROLE_SLOTS) {
    for (const teamId of ctx.teamIds) {
      const unit = ctx.roleUnits.get(roleUnitKey(teamId, slot));
      if (!unit) continue;
      const players = unit.playerIds
        .map((id) => ctx.players.get(id))
        .filter((p): p is Player => p !== undefined);

      for (const prefix of ALL_PREFIX_IDS) {
        const sum = players.reduce(
          (acc, p) => acc + prefixProbability(p, prefix, ctx.titleContext.prefixLeagueMean).value,
          0,
        );
        out[`${teamId}:${slot}:${prefix}`] =
          (PREFIX_DEFINITIONS[prefix].bonus * sum) / playersInRole(slot);
      }
    }
  }

  return out;
}

function suffixFactor(suffix: SuffixId, slot: RoleSlot, ctx: EngineContext): number {
  const def = SUFFIX_DEFINITIONS[suffix];
  const probability = def.probabilityBasis === 'team-dependent'
    ? ctx.titleContext.lossProbabilityByRole[slot]
    : def.perMapProbability;
  return def.bonus * probability;
}

export interface RankedLineup {
  readonly title: CoachTitle;
  readonly perRole: Readonly<Record<RoleSlot, RoleCandidate>>;
  /** Total sem titulo. */
  readonly baseTotal: ScoreDistribution;
  readonly titleGain: number;
  readonly total: ScoreDistribution;
  readonly objectiveValue: number;
}

function applyFactor(d: ScoreDistribution, factor: number): ScoreDistribution {
  return distributionFromMoments(d.mean * (1 + factor), d.sd * (1 + factor));
}

/**
 * Passo 2 — a escalacao otima, EXATA.
 *
 * As funcoes nao sao independentes porque o titulo vale pros 5 jogadores. Mas com
 * o titulo FIXADO elas voltam a ser separaveis, porque o titulo entra como um
 * fator linear por funcao. Entao: laco externo nos 8 prefixos x 8 sufixos, e por
 * dentro cada funcao escolhe seu proprio maximo, independente.
 *
 * Isso e exato — nao e poda nem heuristica. Ha um teste que compara com a forca
 * bruta do produto completo numa instancia reduzida.
 */
export function optimizeLineup(
  ctx: EngineContext,
  objective: Objective = expectedScore,
  topK = 10,
): readonly RankedLineup[] {
  return optimizeFromCandidates(evaluateRoleCandidates(ctx), ctx, objective, topK);
}

/** Mesmo otimizador, com os candidatos ja pontuados. Usado pelo worker e pelos testes. */
export function optimizeFromCandidates(
  candidates: Readonly<Record<RoleSlot, readonly RoleCandidate[]>>,
  ctx: EngineContext,
  objective: Objective = expectedScore,
  topK = 10,
): readonly RankedLineup[] {
  const prefixFactors = prefixFactorByTeam(ctx);
  const results: RankedLineup[] = [];

  for (const prefix of ALL_PREFIX_IDS) {
    for (const suffix of ALL_SUFFIX_IDS) {
      const perRole: Record<string, RoleCandidate> = {};
      const adjusted: Record<string, ScoreDistribution> = {};
      let baseMean = 0;
      let baseVariance = 0;
      let totalMean = 0;
      let totalVariance = 0;

      for (const slot of ALL_ROLE_SLOTS) {
        const sFactor = suffixFactor(suffix, slot, ctx);
        let best: RoleCandidate | null = null;
        let bestValue = Number.NEGATIVE_INFINITY;
        let bestDist: ScoreDistribution | null = null;

        for (const candidate of candidates[slot]) {
          const factor = (prefixFactors[`${candidate.teamId}:${slot}:${prefix}`] ?? 0) + sFactor;
          const dist = applyFactor(candidate.perPeriod, factor);
          const value = objective(dist);
          if (value > bestValue) {
            bestValue = value;
            best = candidate;
            bestDist = dist;
          }
        }

        if (!best || !bestDist) continue;
        perRole[slot] = best;
        adjusted[slot] = bestDist;
        baseMean += best.perPeriod.mean;
        baseVariance += best.perPeriod.sd ** 2;
        totalMean += bestDist.mean;
        totalVariance += bestDist.sd ** 2;
      }

      const baseTotal = distributionFromMoments(baseMean, Math.sqrt(baseVariance));
      const total = distributionFromMoments(totalMean, Math.sqrt(totalVariance));
      results.push({
        title: { prefix, suffix },
        perRole: perRole as Readonly<Record<RoleSlot, RoleCandidate>>,
        baseTotal,
        titleGain: total.mean - baseTotal.mean,
        total,
        objectiveValue: objective(total),
      });
    }
  }

  return results.sort((a, b) => b.objectiveValue - a.objectiveValue).slice(0, topK);
}

/**
 * Melhores candidatos de UMA funcao, sem titulo. E o que a tela mostra quando o
 * Kamus quer discutir "e se eu trocar so o Suporte?".
 */
export function topRoleCandidates(
  ctx: EngineContext,
  slot: RoleSlot,
  objective: Objective = expectedScore,
  topK = 8,
): readonly RoleCandidate[] {
  const candidates = evaluateRoleCandidates(ctx)[slot];
  return [...candidates]
    .sort((a, b) => objective(b.perPeriod) - objective(a.perPeriod))
    .slice(0, topK);
}

/** Melhor time por funcao, agregando as atribuicoes de stat de cada um. */
export function bestPerTeam(
  candidates: readonly RoleCandidate[],
  objective: Objective = expectedScore,
): readonly RoleCandidate[] {
  const best = new Map<string, RoleCandidate>();
  for (const candidate of candidates) {
    const current = best.get(candidate.teamId);
    if (!current || objective(candidate.perPeriod) > objective(current.perPeriod)) {
      best.set(candidate.teamId, candidate);
    }
  }
  return [...best.values()].sort((a, b) => objective(b.perPeriod) - objective(a.perPeriod));
}
