import { z } from 'zod';
import { ALL_PREFIX_IDS } from '../domain/titles';
import { ALL_STAT_IDS } from '../domain/stats';

/**
 * Validacao na fronteira, confianca total la dentro.
 *
 * Se um JSON cru estiver corrompido, tem que estourar ALTO aqui — nunca virar
 * NaN silencioso tres camadas abaixo, no meio da transmissao. Todo campo numerico
 * e `finite`, nao so `number`: NaN e Infinity passam por `z.number()`.
 */

const finite = z.number().finite();
const nonNegative = finite.nonnegative();

const positionSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

export const teamsFileSchema = z.object({
  teams: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      tag: z.string().min(1),
      region: z.string().min(1),
      aliases: z.array(z.string()).optional(),
      players: z
        .array(
          z.object({
            id: z.string().min(1),
            nick: z.string().min(1),
            position: positionSchema,
          }),
        )
        .length(5),
    }),
  ).length(16),
});

/** Uma linha de stats crua. Chaves de stat sao opcionais porque cada funcao so publica as cores dela. */
const rawStatRow = z
  .object({
    pair: z.string().optional(),
    player: z.string().optional(),
    average: finite.optional(),
    top: finite.optional(),
  })
  .catchall(finite);

/** Tira as chaves de documentacao (`_note`, `_meta`) antes de validar os dados de verdade. */
const withoutMetaKeys = <T>(inner: z.ZodType<T>) =>
  z.preprocess((raw) => {
    if (typeof raw !== 'object' || raw === null) return raw;
    return Object.fromEntries(Object.entries(raw as Record<string, unknown>).filter(([k]) => !k.startsWith('_')));
  }, inner);

export const redditRoleStatsSchema = z.object({
  core: withoutMetaKeys(z.record(z.string(), rawStatRow)),
  mid: withoutMetaKeys(z.record(z.string(), rawStatRow)),
  support: withoutMetaKeys(z.record(z.string(), rawStatRow)),
});

const leagueStatRecord = z.object(
  Object.fromEntries(ALL_STAT_IDS.map((id) => [id, nonNegative])) as Record<string, typeof nonNegative>,
);

export const battlepassLeagueSchema = z.object({
  leagueStatValues: z.object({
    core: leagueStatRecord,
    mid: leagueStatRecord,
    support: leagueStatRecord,
  }),
  publishedTitleGains: z.object({
    baselineTotal: finite,
    gains: z.array(
      z.object({
        titleId: z.string(),
        bonus: finite,
        total: finite,
        gain: finite,
        impliedProbability: finite,
      }),
    ),
  }),
  defaultPreviewBanner: z.object({
    allQualityTier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    core: z.array(z.enum(ALL_STAT_IDS as [string, ...string[]])).length(3),
    mid: z.array(z.enum(ALL_STAT_IDS as [string, ...string[]])).length(3),
    support: z.array(z.enum(ALL_STAT_IDS as [string, ...string[]])).length(3),
  }),
  _meta: z.object({ seasonAverageRosterTotal: finite }).passthrough(),
});

const topRoleEntry = z.object({
  teamId: z.string().min(1),
  roleScore: nonNegative,
  sharedMaps: z.number().int().positive(),
  players: z.array(
    z.object({
      id: z.string().min(1),
      score: nonNegative,
      games: z.number().int().positive().nullable(),
    }),
  ),
});

export const battlepassTopRolesSchema = z.object({
  core: z.array(topRoleEntry),
  mid: z.array(topRoleEntry),
  support: z.array(topRoleEntry),
});

const prefixFrequencyRecord = z.object(
  Object.fromEntries(
    ALL_PREFIX_IDS.map((id) => [id, finite.min(0).max(1).optional()]),
  ) as Record<string, z.ZodOptional<typeof finite>>,
);

export const prefixFrequencySchema = z.object({
  byPlayer: z.record(z.string(), prefixFrequencyRecord),
});

/**
 * Troca de elenco posterior a publicacao das tabelas.
 *
 * `slot` e validado contra os tres nomes reais: uma funcao escrita errada aqui
 * invalidaria silenciosamente nada, e o site seguiria mostrando o jogador que
 * saiu. Erro de digitacao neste arquivo tem que estourar na fronteira.
 */
export const rosterChangesSchema = z.object({
  changes: z.array(
    z.object({
      teamId: z.string().min(1),
      slot: z.enum(['core', 'mid', 'support']),
      date: z.string().min(1),
      out: z.object({ id: z.string().min(1), nick: z.string().min(1) }),
      in: z.object({ id: z.string().min(1), nick: z.string().min(1), position: positionSchema }),
      reasonPtBr: z.string().min(1),
      source: z.string().min(1),
      invalidatesTeamData: z.boolean(),
    }).passthrough(),
  ),
});

export type TeamsFile = z.infer<typeof teamsFileSchema>;
export type RosterChangesFile = z.infer<typeof rosterChangesSchema>;
export type RedditRoleStats = z.infer<typeof redditRoleStatsSchema>;
export type BattlepassLeague = z.infer<typeof battlepassLeagueSchema>;
export type BattlepassTopRoles = z.infer<typeof battlepassTopRolesSchema>;
export type PrefixFrequencyFile = z.infer<typeof prefixFrequencySchema>;

/** Estoura com mensagem legivel em vez de deixar dado ruim entrar no motor. */
export function parseOrThrow<T>(schema: z.ZodType<T>, raw: unknown, fileName: string): T {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  const issues = result.error.issues
    .slice(0, 8)
    .map((i) => `  ${i.path.join('.') || '(raiz)'}: ${i.message}`)
    .join('\n');
  throw new Error(`Dado invalido em ${fileName}:\n${issues}`);
}
