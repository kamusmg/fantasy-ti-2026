import { ALL_ROLE_SLOTS, playersInRole } from '../domain/roles';
import type { RoleSlot } from '../domain/roles';
import type { Player } from '../domain/roster';
import { PREFIX_DEFINITIONS, SUFFIX_DEFINITIONS } from '../domain/titles';
import type { CoachTitle, PrefixId, SuffixId } from '../domain/titles';
import type { ScoringRuleSet } from '../domain/rules';

/**
 * Titulo de Treinador.
 *
 * Duas coisas aqui sao facilmente feitas errado, e as duas mudam qual titulo vence.
 *
 * 1) O PESO. A nota de uma funcao e a MEDIA dos jogadores nela, e as funcoes SOMAM.
 *    Entao o ganho e:
 *
 *      E[ganho] = bonus x SOMA_funcao ( S_funcao / |jogadores| ) x SOMA_jogador P(condicao)
 *
 *    Com notas iguais, isso da peso 1/3 pro Meio e 1/6 pra cada jogador de dupla.
 *    Uma media simples pelos 5 jogadores daria 1/5 pra cada — subestimando o Meio
 *    em 40%. O Nisha, com 53% de herois Sobrenaturais, vale bem mais do que a media
 *    simples credita.
 *
 * 2) A CENSURA. So temos o top-3 de prefixos de cada jogador. Tratar os outros
 *    cinco como 0% e vies de selecao puro: favorece prefixos que por acaso caem
 *    num top-3. O certo e uma cota SUPERIOR — se nao esta no top-3 do jogador,
 *    entao e no maximo o menor valor do top-3 dele.
 */

const CENSORED = 'censored';
const OBSERVED = 'observed';
export type FrequencyBasis = typeof CENSORED | typeof OBSERVED;

export interface PrefixProbability {
  readonly value: number;
  readonly basis: FrequencyBasis;
}

/**
 * P(condicao do prefixo vale | jogador), tratando ausencia como CENSURA e nao
 * como zero. A cota `min(top3)` e valida por construcao: se o prefixo nao esta
 * no top-3, ele e no maximo o terceiro colocado.
 */
export function prefixProbability(
  player: Player,
  prefix: PrefixId,
  leagueMean: Readonly<Record<PrefixId, number>>,
): PrefixProbability {
  const observed = player.prefixFrequency[prefix];
  if (observed !== undefined) return { value: observed, basis: OBSERVED };

  const top3 = Object.values(player.prefixFrequency);
  const smallestObserved = top3.length > 0 ? Math.min(...top3) : 1;
  return { value: Math.min(leagueMean[prefix] ?? smallestObserved, smallestObserved), basis: CENSORED };
}

/**
 * Media de liga por prefixo, sobre os jogadores em que ele foi observado.
 *
 * E uma estimativa enviesada PRA CIMA (so conta onde apareceu no top-3), o que
 * e exatamente o que se quer numa cota superior.
 */
export function prefixLeagueMeans(players: Iterable<Player>): Readonly<Record<PrefixId, number>> {
  const sums: Partial<Record<PrefixId, number>> = {};
  const counts: Partial<Record<PrefixId, number>> = {};
  for (const player of players) {
    for (const [prefix, value] of Object.entries(player.prefixFrequency)) {
      const key = prefix as PrefixId;
      sums[key] = (sums[key] ?? 0) + value;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  const out: Partial<Record<PrefixId, number>> = {};
  for (const key of Object.keys(PREFIX_DEFINITIONS) as PrefixId[]) {
    const count = counts[key] ?? 0;
    out[key] = count > 0 ? (sums[key] ?? 0) / count : 0;
  }
  return out as Readonly<Record<PrefixId, number>>;
}

export interface TitleContext {
  /** P(o time da funcao perder um mapa). Alimenta o sufixo Azarao. Vem do Suico. */
  readonly lossProbabilityByRole: Readonly<Record<RoleSlot, number>>;
  readonly prefixLeagueMean: Readonly<Record<PrefixId, number>>;
}

export interface TitleEvaluation {
  readonly expectedGain: number;
  readonly perRole: Readonly<Record<RoleSlot, number>>;
  /** Quantos jogadores entraram com frequencia censurada em vez de observada. */
  readonly censoredPlayerCount: number;
}

export function prefixGain(
  prefix: PrefixId,
  roleScores: Readonly<Record<RoleSlot, number>>,
  rolePlayers: Readonly<Record<RoleSlot, readonly Player[]>>,
  ctx: TitleContext,
): TitleEvaluation {
  const bonus = PREFIX_DEFINITIONS[prefix].bonus;
  const perRole: Record<string, number> = {};
  let censoredPlayerCount = 0;

  for (const slot of ALL_ROLE_SLOTS) {
    const players = rolePlayers[slot];
    const weight = roleScores[slot] / playersInRole(slot);
    let sumProbability = 0;
    for (const player of players) {
      const p = prefixProbability(player, prefix, ctx.prefixLeagueMean);
      if (p.basis === CENSORED) censoredPlayerCount += 1;
      sumProbability += p.value;
    }
    perRole[slot] = bonus * weight * sumProbability;
  }

  const expectedGain = ALL_ROLE_SLOTS.reduce((acc, slot) => acc + perRole[slot], 0);
  return { expectedGain, perRole: perRole as Readonly<Record<RoleSlot, number>>, censoredPlayerCount };
}

export function suffixGain(
  suffix: SuffixId,
  roleScores: Readonly<Record<RoleSlot, number>>,
  ctx: TitleContext,
): TitleEvaluation {
  const def = SUFFIX_DEFINITIONS[suffix];
  const perRole: Record<string, number> = {};

  for (const slot of ALL_ROLE_SLOTS) {
    // O Azarao e o unico sufixo que depende do time: elenco mais fraco perde mais
    // e dispara mais. Os outros usam a probabilidade de liga.
    const probability = def.probabilityBasis === 'team-dependent'
      ? ctx.lossProbabilityByRole[slot]
      : def.perMapProbability;
    perRole[slot] = def.bonus * roleScores[slot] * probability;
  }

  const expectedGain = ALL_ROLE_SLOTS.reduce((acc, slot) => acc + perRole[slot], 0);
  return { expectedGain, perRole: perRole as Readonly<Record<RoleSlot, number>>, censoredPlayerCount: 0 };
}

export function titleGain(
  title: CoachTitle,
  roleScores: Readonly<Record<RoleSlot, number>>,
  rolePlayers: Readonly<Record<RoleSlot, readonly Player[]>>,
  ctx: TitleContext,
  rules: ScoringRuleSet,
): TitleEvaluation {
  const zero: TitleEvaluation = {
    expectedGain: 0,
    perRole: { core: 0, mid: 0, support: 0 },
    censoredPlayerCount: 0,
  };
  const prefix = title.prefix ? prefixGain(title.prefix, roleScores, rolePlayers, ctx) : zero;
  const suffix = title.suffix ? suffixGain(title.suffix, roleScores, ctx) : zero;

  if (rules.titleComposition === 'additive') {
    return {
      expectedGain: prefix.expectedGain + suffix.expectedGain,
      perRole: {
        core: prefix.perRole.core + suffix.perRole.core,
        mid: prefix.perRole.mid + suffix.perRole.mid,
        support: prefix.perRole.support + suffix.perRole.support,
      },
      censoredPlayerCount: prefix.censoredPlayerCount,
    };
  }

  // Multiplicativo: (1+a)(1+b) - 1 sobre a base de cada funcao.
  const perRole: Record<string, number> = {};
  for (const slot of ALL_ROLE_SLOTS) {
    const base = roleScores[slot];
    if (base === 0) {
      perRole[slot] = 0;
      continue;
    }
    const a = prefix.perRole[slot] / base;
    const b = suffix.perRole[slot] / base;
    perRole[slot] = base * ((1 + a) * (1 + b) - 1);
  }
  return {
    expectedGain: ALL_ROLE_SLOTS.reduce((acc, slot) => acc + perRole[slot], 0),
    perRole: perRole as Readonly<Record<RoleSlot, number>>,
    censoredPlayerCount: prefix.censoredPlayerCount,
  };
}
