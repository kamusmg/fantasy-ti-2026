import type { PrefixId } from './titles';
import type { RoleSlot } from './roles';
import type { StatId } from './stats';
import type { DataWarning, Estimate } from './estimate';

export type Position = 1 | 2 | 3 | 4 | 5;

export interface Player {
  readonly id: string;
  readonly nick: string;
  readonly teamId: string;
  readonly position: Position;
  /**
   * Fracao das partidas em que a condicao do prefixo vale.
   *
   * PARCIAL DE PROPOSITO: a fonte so publica o top-3. Prefixo ausente NAO e zero,
   * e censurado — engine/coach.ts aplica a cota superior. Ler isso como zero
   * enviesa a escolha de prefixo.
   */
  readonly prefixFrequency: Readonly<Partial<Record<PrefixId, number>>>;
}

export interface Team {
  readonly id: string;
  readonly name: string;
  readonly tag: string;
  readonly region: string;
  readonly aliases: readonly string[];
  readonly playerIds: readonly string[];
}

/**
 * A unidade escolhivel: um par (time, funcao).
 *
 * IMPORTANTE — perMapStat ja esta na ESCALA DA FUNCAO. As somas de dupla do Reddit
 * ja foram divididas por 2 em load.ts. Nada depois daqui divide de novo.
 */
export interface RoleUnit {
  readonly teamId: string;
  readonly slot: RoleSlot;
  readonly playerIds: readonly string[];
  readonly perMapStat: Readonly<Record<StatId, Estimate>>;
  readonly warnings: readonly DataWarning[];
}

export interface Dataset {
  readonly teams: ReadonlyMap<string, Team>;
  readonly players: ReadonlyMap<string, Player>;
  /** Chave: `${teamId}:${slot}`. */
  readonly roleUnits: ReadonlyMap<string, RoleUnit>;
  readonly leagueMean: Readonly<Record<RoleSlot, Readonly<Record<StatId, number>>>>;
  readonly warnings: readonly DataWarning[];
  readonly generatedAt: string;
}

export function roleUnitKey(teamId: string, slot: RoleSlot): string {
  return `${teamId}:${slot}`;
}
