import teamsRaw from './raw/teams.json';
import redditRaw from './raw/reddit.roleStats.json';
import battlepassLeagueRaw from './raw/battlepass.leagueStats.json';
import battlepassTopRolesRaw from './raw/battlepass.topRoles.json';
import prefixFrequencyRaw from './raw/prefixFrequency.json';
import rosterChangesRaw from './raw/rosterChanges.json';

import {
  battlepassLeagueSchema,
  battlepassTopRolesSchema,
  parseOrThrow,
  prefixFrequencySchema,
  redditRoleStatsSchema,
  rosterChangesSchema,
  teamsFileSchema,
} from './schema';
import type { RedditRoleStats, RosterChangesFile } from './schema';
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
  readonly rosterChanges: RosterChangesFile['changes'];
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
function collectSampleMaps(
  topRoles: ReturnType<typeof parseTopRoles>,
  invalidated: ReadonlySet<string>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const slot of ALL_ROLE_SLOTS) {
    for (const entry of topRoles[slot]) {
      const key = `${entry.teamId}:${slot}`;
      if (invalidated.has(key)) continue;
      out[key] = entry.sharedMaps;
    }
  }
  return out;
}

/**
 * Razao teto/media por (time, funcao) — estimador do tamanho de amostra.
 * `top` e a melhor partida unica; E[maximo de n] cresce com n.
 */
function collectTopRatios(
  reddit: RedditRoleStats,
  invalidated: ReadonlySet<string>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const slot of ALL_ROLE_SLOTS) {
    for (const [teamId, row] of Object.entries(reddit[slot])) {
      if (teamId.startsWith('_')) continue;
      if (invalidated.has(`${teamId}:${slot}`)) continue;
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
  const rosterChanges = parseOrThrow(rosterChangesSchema, rosterChangesRaw, 'rosterChanges.json').changes;
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

  /*
    Troca de elenco: o par (time, funcao) perde o dado de TIME das duas fontes.
    Nao e o mesmo que apagar o time do ranking — ele continua escolhivel, so que
    valendo a media da liga. Sumir do ranking seria mentir por omissao pra quem
    esta montando a escalacao.
  */
  const invalidatedUnits = new Set<string>();
  for (const change of rosterChanges) {
    if (!change.invalidatesTeamData) continue;
    const key = `${change.teamId}:${change.slot}`;
    invalidatedUnits.add(key);
    const teamName = teams.get(change.teamId)?.name ?? change.teamId;
    warnings.push({
      severity: 'warn',
      code: 'roster-change',
      messagePtBr:
        `${teamName} trocou ${change.out.nick} por ${change.in.nick} na funcao ${change.slot} em ${change.date}. ` +
        `As tabelas do Reddit e do battlepass mediram ${change.out.nick}, entao o dado de time deste par foi ` +
        `INVALIDADO e a funcao caiu na media da liga. Motivo: ${change.reasonPtBr}`,
    });
    if (players.has(change.out.id)) {
      warnings.push({
        severity: 'critical',
        code: 'roster-change',
        messagePtBr:
          `${change.out.nick} saiu do elenco em ${change.date} mas ainda esta em teams.json. ` +
          `Enquanto estiver la, o nome dele aparece na tela.`,
      });
    }
  }

  for (const [id, p] of players) {
    if (Object.keys(p.prefixFrequency).length > 0) continue;
    warnings.push({
      severity: 'warn',
      code: 'no-team-data',
      messagePtBr: `Sem frequencia de cor de heroi pro jogador ${p.nick} (${id}); o prefixo cai na cota superior censurada.`,
    });
  }

  /*
    A linha crua fica intocada no JSON; o que muda e o que sai daqui pra mistura.
    Unidade invalidada vira linha VAZIA em vez de sumir: a chave precisa
    sobreviver pro time continuar aparecendo no ranking, e sem nenhuma stat todo
    valor cai em `league-mean-fallback` com peso zero, que e exatamente o certo.
  */
  const forBlend = (slot: RoleSlot) =>
    Object.fromEntries(
      Object.entries(reddit[slot])
        .filter(([k]) => !k.startsWith('_'))
        .map(([teamId, row]) => [
          teamId,
          invalidatedUnits.has(`${teamId}:${slot}`) ? {} : statColumnsOnly(row),
        ]),
    );

  const redditForBlend = {
    core: forBlend('core'),
    mid: forBlend('mid'),
    support: forBlend('support'),
  };

  /*
    O top-8 do battlepass tambem descreve o elenco antigo, e ele alimenta a
    medida de transferibilidade. Unidade invalidada sai daqui pelo mesmo motivo
    que sai do resto.
  */
  const topEightByRole = byRoleSlot<ReadonlySet<string>>(
    (slot) =>
      new Set(
        topRoles[slot]
          .map((e) => e.teamId)
          .filter((teamId) => !invalidatedUnits.has(`${teamId}:${slot}`)),
      ),
  );

  const blended = blend({
    reddit: redditForBlend,
    battlepassLeague: league.leagueStatValues as Readonly<Record<RoleSlot, Readonly<Record<StatId, number>>>>,
    sampleMaps: collectSampleMaps(topRoles, invalidatedUnits),
    topRatio: collectTopRatios(reddit, invalidatedUnits),
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

      const change = rosterChanges.find(
        (c) => c.invalidatesTeamData && c.teamId === teamId && c.slot === slot,
      );

      /*
        Duas mensagens bem diferentes, e a distincao importa na tela: "uma cor
        nao tem dado" e rotina (o Azul do Meio e assim pra todo mundo); "o
        jogador medido nao joga mais" e a funcao inteira cega.
      */
      const unitWarnings: DataWarning[] = change
        ? [{
            severity: 'warn',
            code: 'roster-change',
            messagePtBr:
              `${change.out.nick} saiu (${change.reasonPtBr}) e ${change.in.nick} entrou. ` +
              `Nenhuma das fontes mediu ${change.in.nick}, entao esta funcao vale a media da liga inteira.`,
          }]
        : Object.values(statMap)
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
    rosterChanges,
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
