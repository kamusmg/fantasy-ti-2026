import type { EmblemColor } from './stats';

export type RoleSlot = 'core' | 'mid' | 'support';
export type Period = 'groupStage' | 'mainEvent';

export const ALL_ROLE_SLOTS: readonly RoleSlot[] = ['core', 'mid', 'support'];

export const ROLE_LABEL_PT_BR: Readonly<Record<RoleSlot, string>> = {
  core: 'Principal',
  mid: 'Meio',
  support: 'Suporte',
};

/** Quais posicoes do time voce leva ao escolher aquele time pra funcao. */
export const ROLE_POSITIONS: Readonly<Record<RoleSlot, readonly (1 | 2 | 3 | 4 | 5)[]>> = {
  core: [1, 3],
  mid: [2],
  support: [4, 5],
};

/**
 * Cores dos emblemas, fixas pela Valve e nao rerrolaveis.
 *
 * O Evento Principal HERDA os 3 primeiros emblemas da Fase de Grupos e ganha mais 2.
 * Fonte: guia do u/Maroomm corroborado por teamsmurf.com.
 */
export const BANNER_LAYOUT: Readonly<Record<RoleSlot, Readonly<Record<Period, readonly EmblemColor[]>>>> = {
  core: {
    groupStage: ['red', 'green', 'red'],
    mainEvent: ['red', 'green', 'red', 'green', 'red'],
  },
  mid: {
    groupStage: ['red', 'blue', 'green'],
    mainEvent: ['red', 'blue', 'green', 'red', 'green'],
  },
  support: {
    groupStage: ['blue', 'green', 'blue'],
    mainEvent: ['blue', 'green', 'blue', 'green', 'blue'],
  },
};

/** Quantos jogadores dividem a nota da funcao. A nota e a MEDIA deles, nunca a soma. */
export function playersInRole(slot: RoleSlot): number {
  return ROLE_POSITIONS[slot].length;
}

/**
 * Constroi um registro indexado por funcao SEM cast.
 * `Object.fromEntries` devolve `Record<string, T>` e obriga a um `as`, que e
 * exatamente o tipo de buraco por onde entra dado errado.
 */
export function byRoleSlot<T>(make: (slot: RoleSlot) => T): Record<RoleSlot, T> {
  return { core: make('core'), mid: make('mid'), support: make('support') };
}
