import { useMemo } from 'react';
import { loadDataset } from '../data/load';
import type { LoadedData } from '../data/load';
import { buildContext } from '../engine/context';
import type { ContextOptions } from '../engine/context';
import { bestPerTeam, evaluateRoleCandidates, optimizeFromCandidates } from '../engine/optimize';
import type { RankedLineup, RoleCandidate } from '../engine/optimize';
import type { Objective } from '../engine/objectives';
import { expectedScore } from '../engine/objectives';
import { ALL_ROLE_SLOTS } from '../domain/roles';
import type { RoleSlot } from '../domain/roles';

export interface EngineResult {
  readonly data: LoadedData;
  readonly ranked: readonly RankedLineup[];
  readonly candidates: Readonly<Record<RoleSlot, readonly RoleCandidate[]>>;
  readonly perTeam: Readonly<Record<RoleSlot, readonly RoleCandidate[]>>;
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

    return {
      data,
      ranked,
      candidates,
      perTeam,
      elapsedMs,
      candidateCount: ALL_ROLE_SLOTS.reduce((acc, s) => acc + candidates[s].length, 0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey, objective]);
}
