import teamsRaw from './raw/teams.json';
import redditRaw from './raw/reddit.roleStats.json';
import battlepassLeagueRaw from './raw/battlepass.leagueStats.json';
import battlepassTopRolesRaw from './raw/battlepass.topRoles.json';
import prefixFrequencyRaw from './raw/prefixFrequency.json';

import {
  battlepassLeagueSchema,
  battlepassTopRolesSchema,
  parseOrThrow,
  prefixFrequencySchema,
  redditRoleStatsSchema,
  teamsFileSchema,
} from './schema';
import type { RedditRoleStats } from './schema';
import { blend } from './blend';
import type { BlendDiagnostics } from './blend';
import { ALL_ROLE_SLOTS, ROLE_POSITIONS, byRoleSlot } from '../domain/roles';
import type { RoleSlot } from '../domain/roles';
import type { StatId } from '../domain/stats';
import { ALL_STAT_IDS } from '../domain/stats';
import type { Dataset, Player, RoleUnit, Team } from '../domain/roster';
import { roleUnitKey } from '../domain/roster';
import type { DataWarning, Estimate } from '../domain/estimate';
import { DEFAULT_RULES } from '../domain/rules';
import type { ScoringRuleSet } from '../domain/rules';
import type { PrefixId } from '../domain/titles';

export interface LoadedData extends Dataset {
  readonly diagnostics: BlendDiagnostics;
  readonly battlepassTopRoles: ReturnType<typeof parseTopRoles>;
  readonly seasonAverageRosterTotal: number;
  readonly defaultPreviewBanner: Readonly<Record<RoleSlot, readonly StatId[]>>;
  readonly defaultPreviewQuality: 1 | 2 | 3 | 4 | 5;
  readonly publishedTitleGains: readonly {
    readonly titleId: string;
    readonly bonus: number;
    readonly gain: number;
    readonly impliedProbability: number;
  }[];
  readonly battlepassBaselineTotal: number;
}

function parseTopRoles() {
  return parseOrThrow(battlepassTopRolesSchema, battlepassTopRolesRaw, 'battlepass.topRoles.json');
}

/** Mapas observados por (time, funcao), do que o battlepass publica no top-8. */
function collectSampleMaps(topRoles: ReturnType<typeof parseTopRoles>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const slot of ALL_ROLE_SLOTS) {
    for (const entry of topRoles[slot]) {
      out[`${entry.teamId}:${slot}`] = entry.sharedMaps;
    }
  }
  return out;
}

/**
 * Razao teto/media por (time, funcao) — estimador do tamanho de amostra.
 * `top` e a melhor partida unica; E[maximo de n] cresce com n.
 */
function collectTopRatios(reddit: RedditRoleStats): Record<string, number> {
  const out: Record<string, number> = {};
  for (const slot of ALL_ROLE_SLOTS) {
    for (const [teamId, row] of Object.entries(reddit[slot])) {
      if (teamId.startsWith('_')) continue;
      const average = row.average;
      const top = row.top;
      if (typeof average === 'number' && typeof top === 'number' && average > 0) {
        out[`${teamId}:${slot}`] = top / average;
      }
    }
  }
  return out;
}

/** Tira `_note`, `pair`, `player`, `average`, `top` — sobra so stat -> numero. */
function statColumnsOnly(row: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const statId of ALL_STAT_IDS) {
    const value = row[statId];
    if (typeof value === 'number' && Number.isFinite(value)) out[statId] = value;
  }
  return out;
}

export function loadDataset(rules: ScoringRuleSet = DEFAULT_RULES): LoadedData {
  const teamsFile = parseOrThrow(teamsFileSchema, teamsRaw, 'teams.json');
  const reddit = parseOrThrow(redditRoleStatsSchema, redditRaw, 'reddit.roleStats.json');
  const league = parseOrThrow(battlepassLeagueSchema, battlepassLeagueRaw, 'battlepass.leagueStats.json');
  const topRoles = parseTopRoles();
  const prefixFile = parseOrThrow(prefixFrequencySchema, prefixFrequencyRaw, 'prefixFrequency.json');

  const teams = new Map<string, Team>();
  const players = new Map<string, Player>();

  for (const t of teamsFile.teams) {
    teams.set(t.id, {
      id: t.id,
      name: t.name,
      tag: t.tag,
      region: t.region,
      aliases: t.aliases ?? [],
      playerIds: t.players.map((p) => p.id),
    });
    for (const p of t.players) {
      players.set(p.id, {
        id: p.id,
        nick: p.nick,
        teamId: t.id,
        position: p.position,
        prefixFrequency: (prefixFile.byPlayer[p.id] ?? {}) as Readonly<Partial<Record<PrefixId, number>>>,
      });
    }
  }

  const warnings: DataWarning[] = [];
  for (const [id, p] of players) {
    if (Object.keys(p.prefixFrequency).length > 0) continue;
    warnings.push({
      severity: 'warn',
      code: 'no-team-data',
      messagePtBr: `Sem frequencia de cor de heroi pro jogador ${p.nick} (${id}); o prefixo cai na cota superior censurada.`,
    });
  }

  const redditForBlend = {
    core: Object.fromEntries(
      Object.entries(reddit.core).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k, statColumnsOnly(v)]),
    ),
    mid: Object.fromEntries(
      Object.entries(reddit.mid).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k, statColumnsOnly(v)]),
    ),
    support: Object.fromEntries(
      Object.entries(reddit.support).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k, statColumnsOnly(v)]),
    ),
  };

  const topEightByRole = byRoleSlot<ReadonlySet<string>>(
    (slot) => new Set(topRoles[slot].map((e) => e.teamId)),
  );

  const blended = blend({
    reddit: redditForBlend,
    battlepassLeague: league.leagueStatValues as Readonly<Record<RoleSlot, Readonly<Record<StatId, number>>>>,
    sampleMaps: collectSampleMaps(topRoles),
    topRatio: collectTopRatios(reddit),
    topEightByRole,
    rules,
  });

  const roleUnits = new Map<string, RoleUnit>();
  for (const slot of ALL_ROLE_SLOTS) {
    for (const [teamId, statMap] of Object.entries(blended.perMapStat[slot])) {
      const team = teams.get(teamId);
      if (!team) {
        warnings.push({
          severity: 'critical',
          code: 'no-team-data',
          messagePtBr: `A tabela do Reddit tem o time "${teamId}" na funcao ${slot}, mas ele nao existe em teams.json.`,
        });
        continue;
      }
      const playerIds = team.playerIds.filter((pid) => {
        const player = players.get(pid);
        return player !== undefined && ROLE_POSITIONS[slot].includes(player.position);
      });

      const unitWarnings = Object.values(statMap)
        .filter((e) => e.provenance === 'league-mean-fallback')
        .slice(0, 1)
        .map<DataWarning>(() => ({
          severity: 'info',
          code: 'league-fallback',
          messagePtBr: 'Alguma cor desta funcao nao tem dado por time; caiu na media da liga.',
        }));

      roleUnits.set(roleUnitKey(teamId, slot), {
        teamId,
        slot,
        playerIds,
        perMapStat: statMap as Readonly<Record<StatId, Estimate>>,
        warnings: unitWarnings,
      });
    }
  }

  return {
    teams,
    players,
    roleUnits,
    leagueMean: league.leagueStatValues as Readonly<Record<RoleSlot, Readonly<Record<StatId, number>>>>,
    warnings: [...warnings, ...blended.diagnostics.warnings],
    generatedAt: '2026-08-06',
    diagnostics: blended.diagnostics,
    battlepassTopRoles: topRoles,
    seasonAverageRosterTotal: league._meta.seasonAverageRosterTotal,
    defaultPreviewBanner: {
      core: league.defaultPreviewBanner.core as StatId[],
      mid: league.defaultPreviewBanner.mid as StatId[],
      support: league.defaultPreviewBanner.support as StatId[],
    },
    defaultPreviewQuality: league.defaultPreviewBanner.allQualityTier,
    publishedTitleGains: league.publishedTitleGains.gains,
    battlepassBaselineTotal: league.publishedTitleGains.baselineTotal,
  };
}
