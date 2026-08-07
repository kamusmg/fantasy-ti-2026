import { useMemo } from 'react';
import { loadDataset } from '../data/load';
import type { LoadedData } from '../data/load';
import { buildContext } from '../engine/context';
import type { ContextOptions } from '../engine/context';
import { bestPerTeam, bestTitleForTeams, evaluateRoleCandidates, optimizeFromCandidates } from '../engine/optimize';
import type { RankedLineup, RoleCandidate } from '../engine/optimize';
import type { CoachTitle } from '../domain/titles';
import { loadDreamTeamAuthors } from '../data/dreamTeams';
import type { DreamTeamAuthor } from '../data/dreamTeams';
import { byRoleSlot } from '../domain/roles';
import type { Objective } from '../engine/objectives';
import { expectedScore } from '../engine/objectives';
import { ALL_ROLE_SLOTS } from '../domain/roles';
import type { RoleSlot } from '../domain/roles';
import { rankTeams } from '../engine/teamRanking';
import type { RoleRanking } from '../engine/teamRanking';

export interface EngineResult {
  readonly data: LoadedData;
  readonly ranked: readonly RankedLineup[];
  readonly candidates: Readonly<Record<RoleSlot, readonly RoleCandidate[]>>;
  readonly perTeam: Readonly<Record<RoleSlot, readonly RoleCandidate[]>>;
  /** Ranking de TIME por funcao — a decisao copiavel, com alvos de reroll juntos. */
  readonly teamRanking: Readonly<Record<RoleSlot, RoleRanking>>;
  /** Escalacoes de outras pessoas, pontuadas pelo mesmo motor. */
  readonly dreamAuthors: readonly DreamTeamAuthor[];
  /** Titulo otimo PARA OS TIMES RECOMENDADOS (p75), nao pro melhor estandarte. */
  readonly recommendedTitle: CoachTitle;
  readonly recommendedTitleGain: number;
  /** Soma das notas p75 dos times recomendados, ja com o titulo. */
  readonly recommendedTotal: number;
  readonly elapsedMs: number;
  readonly candidateCount: number;
}

/**
 * Roda o motor uma vez e memoiza.
 *
 * 9.216 candidatos x 64 titulos levam ~200 ms, o que cabe de sobra numa renderizacao
 * sincrona — nao vale a complexidade de um worker enquanto for esse numero. Se o
 * Evento Principal (5 emblemas, ~202 mil candidatos) apertar, ai sim vai pro worker.
 */
export function useEngine(options: ContextOptions = {}, objective: Objective = expectedScore): EngineResult {
  const optionsKey = JSON.stringify({
    period: options.period,
    rulesId: options.rules?.id,
    rolls: options.rolls,
    lossProbabilityByRole: options.lossProbabilityByRole,
  });

  return useMemo(() => {
    const data = loadDataset(options.rules);
    const ctx = buildContext(data, options);
    const start = performance.now();
    const candidates = evaluateRoleCandidates(ctx);
    const ranked = optimizeFromCandidates(candidates, ctx, objective, 8);
    const elapsedMs = performance.now() - start;

    const perTeam = Object.fromEntries(
      ALL_ROLE_SLOTS.map((slot) => [slot, bestPerTeam(candidates[slot], objective)]),
    ) as Record<RoleSlot, readonly RoleCandidate[]>;

    const teamRanking = rankTeams(candidates, data.roleUnits, ctx.period);

    // O titulo tem que casar com os times QUE ESTAO NA TELA (lideres no p75),
    // nao com os que o otimizador de melhor-estandarte teria escolhido.
    const recommendedTeams = byRoleSlot((slot) => teamRanking[slot].teams[0].teamId);
    const recommendedScores = byRoleSlot((slot) => teamRanking[slot].teams[0].p75Score);
    const title = bestTitleForTeams(recommendedTeams, recommendedScores, ctx);
    const baseTotal = ALL_ROLE_SLOTS.reduce((acc, slot) => acc + recommendedScores[slot], 0);

    return {
      data,
      ranked,
      candidates,
      perTeam,
      teamRanking,
      dreamAuthors: loadDreamTeamAuthors(new Set(data.teams.keys())),
      recommendedTitle: title.title,
      recommendedTitleGain: title.gain,
      recommendedTotal: baseTotal + title.gain,
      elapsedMs,
      candidateCount: ALL_ROLE_SLOTS.reduce((acc, s) => acc + candidates[s].length, 0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey, objective]);
}
