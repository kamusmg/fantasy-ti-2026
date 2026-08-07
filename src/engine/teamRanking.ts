import { byRoleSlot } from '../domain/roles';
import type { Period, RoleSlot } from '../domain/roles';
import type { RoleCandidate } from './optimize';
import type { ColorTargets } from './rerollTargets';
import { rerollTargets } from './rerollTargets';
import { bestTraitPlan } from './traitPlan';
import type { TraitPlan } from './traitPlan';
import { DEFAULT_RULES } from '../domain/rules';
import type { RoleUnit } from '../domain/roster';

/**
 * Ranking de TIME por funcao — a unica decisao 100% livre do fantasy.
 *
 * As stats do estandarte sao SORTEADAS. Entao a nota de um time nao e um numero,
 * e uma DISTRIBUICAO sobre os estandartes que podem sair. Cada time e medido em
 * varios quantis dessa distribuicao:
 *
 *   media  quem nao rerolou nada
 *   p75    quem rerolou com juizo  <- BASE DA RECOMENDACAO
 *   p90    quem rerolou bem
 *   max    sorte perfeita
 *
 * A base e o p75, e nao a media nem o maximo, porque nenhum dos dois descreve uma
 * pessoa de verdade — e porque o maximo e perigoso: e um maximo sobre ~200
 * atribuicoes ruidosas, entao quem vence tende a ser quem carrega o maior ERRO DE
 * ESTIMATIVA, ainda mais depois que a media ja passou pelo encolhimento
 * empirico-Bayes que o maximo existe pra derrotar.
 *
 * MEDIDO: o OG no Meio vai de 16o na media a 4o no maximo sem subir no meio do
 * caminho — maldicao do vencedor classica. Ja o Aurora sobe monotonicamente
 * (12 -> 10 -> 8 -> 1), o que e efeito real, so que so aparece em estandarte
 * extremo. Nenhum dos dois merece entrar na tela como recomendacao.
 */
export interface TeamRanking {
  readonly teamId: string;
  readonly meanScore: number;
  readonly p75Score: number;
  readonly p90Score: number;
  readonly bestScore: number;
  readonly rankByMean: number;
  readonly rankByP75: number;
  readonly rankByBest: number;
  /** Vantagem sobre o SEGUNDO colocado no p75. Negativo se nao for o 1o. */
  readonly marginOverSecond: number;
  /** Bem colocado na media E no p75 — nao depende de sorte no roll. */
  readonly robust: boolean;
  /** Sobe muitas posicoes SO no maximo. Nao recomendar. */
  readonly winnersCurse: boolean;
  readonly bestCandidate: RoleCandidate;
  readonly rerollTargets: readonly ColorTargets[];
  /** Melhor arranjo de tracos possivel — ALVO de reroll, nao escolha. */
  readonly traitPlan: TraitPlan;
}

export interface RoleRanking {
  readonly slot: RoleSlot;
  readonly teams: readonly TeamRanking[];
  /** Distancia do 1o ao 16o no p75. Alto = errar o time aqui CUSTA caro. */
  readonly spread: number;
  /** Vantagem do 1o sobre o 2o. Abaixo de ~2% e empate tecnico. */
  readonly leaderMargin: number;
  /** Ganho da media ate o p90 no lider: o quanto rerolar PAGA nesta funcao. */
  readonly rerollPayoff: number;
}

const ROBUST_RANK = 3;
const TECHNICAL_TIE = 0.02;

function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function isTechnicalTie(margin: number): boolean {
  return margin < TECHNICAL_TIE;
}

export function rankTeams(
  candidates: Readonly<Record<RoleSlot, readonly RoleCandidate[]>>,
  roleUnits: ReadonlyMap<string, RoleUnit>,
  period: Period,
): Readonly<Record<RoleSlot, RoleRanking>> {
  return byRoleSlot<RoleRanking>((slot) => {
    const grouped = new Map<string, { scores: number[]; best: RoleCandidate }>();

    for (const candidate of candidates[slot]) {
      const entry = grouped.get(candidate.teamId);
      if (!entry) {
        grouped.set(candidate.teamId, { scores: [candidate.perPeriod.mean], best: candidate });
        continue;
      }
      entry.scores.push(candidate.perPeriod.mean);
      if (candidate.perPeriod.mean > entry.best.perPeriod.mean) entry.best = candidate;
    }

    const rows = [...grouped.entries()].map(([teamId, e]) => {
      const sorted = [...e.scores].sort((a, b) => a - b);
      return {
        teamId,
        meanScore: sorted.reduce((a, b) => a + b, 0) / sorted.length,
        p75Score: quantile(sorted, 0.75),
        p90Score: quantile(sorted, 0.90),
        bestScore: sorted[sorted.length - 1],
        bestCandidate: e.best,
      };
    });

    const rankOf = (key: 'meanScore' | 'p75Score' | 'bestScore') =>
      new Map([...rows].sort((a, b) => b[key] - a[key]).map((r, i) => [r.teamId, i + 1]));

    const rMean = rankOf('meanScore');
    const rP75 = rankOf('p75Score');
    const rBest = rankOf('bestScore');

    const byP75 = [...rows].sort((a, b) => b.p75Score - a.p75Score);
    const second = byP75[1]?.p75Score ?? byP75[0].p75Score;
    const worst = byP75[byP75.length - 1].p75Score;

    const teams: TeamRanking[] = byP75.map((r) => {
      const unit = roleUnits.get(`${r.teamId}:${slot}`);
      const rm = rMean.get(r.teamId) ?? 0;
      const r75 = rP75.get(r.teamId) ?? 0;
      const rb = rBest.get(r.teamId) ?? 0;
      return {
        teamId: r.teamId,
        meanScore: r.meanScore,
        p75Score: r.p75Score,
        p90Score: r.p90Score,
        bestScore: r.bestScore,
        rankByMean: rm,
        rankByP75: r75,
        rankByBest: rb,
        marginOverSecond: second > 0 ? (r.p75Score - second) / second : 0,
        robust: rm <= ROBUST_RANK && r75 <= ROBUST_RANK,
        // Salta 6+ posicoes so no maximo, sem ter subido ate o p75.
        winnersCurse: rm - rb >= 6 && rm - r75 <= 2,
        bestCandidate: r.bestCandidate,
        rerollTargets: unit ? rerollTargets(unit, period) : [],
        traitPlan: unit
          ? bestTraitPlan(unit, r.bestCandidate.statIds, period, DEFAULT_RULES)
          : { traits: [], bonuses: [], score: 0, gainOverWorst: 0 },
      };
    });

    const leader = byP75[0];
    return {
      slot,
      teams,
      spread: worst > 0 ? (leader.p75Score - worst) / worst : 0,
      leaderMargin: second > 0 ? (leader.p75Score - second) / second : 0,
      rerollPayoff: leader.meanScore > 0 ? (leader.p90Score - leader.meanScore) / leader.meanScore : 0,
    };
  });
}
