import { ALL_ROLE_SLOTS } from '../domain/roles';
import type { RoleSlot } from '../domain/roles';
import { ALL_STAT_IDS, STAT_DEFINITIONS } from '../domain/stats';
import type { StatId } from '../domain/stats';
import type { DataWarning } from '../domain/estimate';
import type { LoadedData } from './load';
import { impliedProbability } from './oracle';
import { QUALITY_BONUS } from '../domain/emblems';

/**
 * Painel de auditoria dos dados — o "mostre seu trabalho" da ferramenta.
 *
 * Existe porque a coisa mais facil de fazer errado num projeto assim e reportar
 * confianca que nao foi conquistada. Aqui todo residuo entre as duas fontes fica
 * exposto, com o alarme visivel quando sai da faixa.
 */

export interface StatResidual {
  readonly slot: RoleSlot;
  readonly statId: StatId;
  readonly labelPtBr: string;
  readonly battlepassLeagueMean: number;
  readonly redditLeagueMeanScaled: number | null;
  readonly ratio: number | null;
  readonly flagged: boolean;
  /** n0 do encolhimento. Alto = stat grumosa, puxa forte pra media da liga. */
  readonly priorStrength: number;
}

export interface TopRoleCheck {
  readonly slot: RoleSlot;
  readonly teamId: string;
  readonly publishedRoleScore: number;
  readonly ourRoleScore: number;
  readonly ratio: number;
  readonly sharedMaps: number;
  readonly flagged: boolean;
}

export interface OracleCheck {
  readonly titleId: string;
  readonly bonus: number;
  readonly publishedGain: number;
  readonly impliedProbability: number;
}

export interface AuditReport {
  readonly scaleFactor: Readonly<Record<RoleSlot, number>>;
  readonly residuals: readonly StatResidual[];
  readonly topRoleChecks: readonly TopRoleCheck[];
  readonly oracle: readonly OracleCheck[];
  readonly ceruleanFromBattlepass: number;
  readonly ceruleanFromReddit: number;
  readonly warnings: readonly DataWarning[];
}

const RATIO_LOW = 0.80;
const RATIO_HIGH = 1.25;
const TOP_ROLE_TOLERANCE = 0.15;

/**
 * Reproduz a nota que o battlepass publica pra um (time, funcao): eles usam um
 * estandarte de referencia com tudo Tier III (x1,6) e sem tracos. Se a nossa
 * conta divergir muito, e erro de unidade ou de mistura — nao "estilo diferente".
 */
export function reproduceTopRoleScore(
  data: LoadedData,
  slot: RoleSlot,
  teamId: string,
): number | null {
  const unit = data.roleUnits.get(`${teamId}:${slot}`);
  if (!unit) return null;
  const multiplier = 1 + QUALITY_BONUS[data.defaultPreviewQuality];
  return data.defaultPreviewBanner[slot].reduce(
    (acc, statId) => acc + unit.perMapStat[statId].mean * multiplier,
    0,
  );
}

export function auditDataset(data: LoadedData, ceruleanFromReddit: number): AuditReport {
  const residuals: StatResidual[] = [];

  for (const slot of ALL_ROLE_SLOTS) {
    const k = data.diagnostics.scaleFactor[slot];
    for (const statId of ALL_STAT_IDS) {
      const battlepassMean = data.leagueMean[slot][statId];

      // Media do Reddit reconstruida a partir dos Estimates: onde caiu em media
      // de liga pura, nao ha residuo pra medir.
      const units = [...data.roleUnits.values()].filter((u) => u.slot === slot);
      const blendedUnits = units.filter((u) => u.perMapStat[statId].provenance === 'blended');
      const redditScaled = blendedUnits.length > 0
        ? blendedUnits.reduce((acc, u) => acc + u.perMapStat[statId].mean, 0) / blendedUnits.length
        : null;

      const ratio = redditScaled !== null && battlepassMean > 0 ? redditScaled / battlepassMean : null;
      residuals.push({
        slot,
        statId,
        labelPtBr: STAT_DEFINITIONS[statId].labelPtBr,
        battlepassLeagueMean: battlepassMean,
        redditLeagueMeanScaled: redditScaled,
        ratio,
        flagged: ratio !== null && (ratio < RATIO_LOW || ratio > RATIO_HIGH),
        priorStrength: data.diagnostics.priorStrength[slot][statId] * (k > 0 ? 1 : 1),
      });
    }
  }

  const topRoleChecks: TopRoleCheck[] = [];
  for (const slot of ALL_ROLE_SLOTS) {
    for (const entry of data.battlepassTopRoles[slot]) {
      const ours = reproduceTopRoleScore(data, slot, entry.teamId);
      if (ours === null) continue;
      const ratio = ours / entry.roleScore;
      topRoleChecks.push({
        slot,
        teamId: entry.teamId,
        publishedRoleScore: entry.roleScore,
        ourRoleScore: ours,
        ratio,
        sharedMaps: entry.sharedMaps,
        flagged: Math.abs(ratio - 1) > TOP_ROLE_TOLERANCE,
      });
    }
  }

  const oracle: OracleCheck[] = data.publishedTitleGains.map((g) => ({
    titleId: g.titleId,
    bonus: g.bonus,
    publishedGain: g.gain,
    impliedProbability: impliedProbability(g.gain, g.bonus, data.seasonAverageRosterTotal),
  }));

  const cerulean = data.publishedTitleGains.find((g) => g.titleId === 'cerulean');

  return {
    scaleFactor: data.diagnostics.scaleFactor,
    residuals,
    topRoleChecks,
    oracle,
    ceruleanFromBattlepass: cerulean
      ? impliedProbability(cerulean.gain, cerulean.bonus, data.seasonAverageRosterTotal)
      : 0,
    ceruleanFromReddit,
    warnings: data.warnings,
  };
}
