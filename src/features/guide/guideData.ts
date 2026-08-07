import type { EmblemColor, StatId } from '../../domain/stats';
import type { RoleSlot } from '../../domain/roles';

/**
 * A tabela do guia, transcrita da cola do Kamus.
 *
 * As stats entram como `StatId`, nunca como texto solto: assim o rotulo sai do
 * `STAT_DEFINITIONS` e a tela ganha ingles de graca, e um nome que nao existe no
 * jogo nao compila. O `raw` e a valvula pros poucos itens da tabela que nao sao
 * uma stat (ex.: "RNG", que agrupa os eventos de sorte).
 */
export type GuideItem = StatId | { readonly raw: string; readonly rawEn: string };

export interface TierList {
  readonly top: readonly GuideItem[];
  readonly mid: readonly GuideItem[];
  readonly bad: readonly GuideItem[];
}

export interface ColorGuide {
  readonly color: EmblemColor;
  /**
   * Quantos emblemas dessa cor a funcao tem na Fase de Grupos.
   * Zero = a cor nem aparece no estandarte; ai vale a `note` no lugar da lista.
   */
  readonly emblems: number;
  readonly tiers?: TierList;
  /** Chave em `Strings`, pra nota render nos dois idiomas. */
  readonly noteKey?: 'guideNoteCoreBlue' | 'guideNoteSupportRed';
}

export interface RoleGuide {
  readonly slot: RoleSlot;
  readonly colors: readonly ColorGuide[];
  readonly overall: TierList;
}

const RNG: GuideItem = { raw: 'RNG', rawEn: 'RNG' };

export const ROLE_GUIDES: readonly RoleGuide[] = [
  {
    slot: 'core',
    colors: [
      {
        color: 'red',
        emblems: 2,
        tiers: {
          top: ['creepScore', 'gpm', 'deaths'],
          mid: ['towerKills', 'kills'],
          bad: ['madstone'],
        },
      },
      { color: 'blue', emblems: 0, noteKey: 'guideNoteCoreBlue' },
      {
        color: 'green',
        emblems: 1,
        tiers: {
          top: ['teamfight', 'tormentor'],
          mid: ['roshan'],
          bad: ['firstBlood', 'courier'],
        },
      },
    ],
    overall: {
      top: ['creepScore', 'gpm', 'deaths', 'teamfight'],
      mid: ['tormentor', 'towerKills', 'roshan'],
      bad: ['madstone', 'firstBlood', 'courier'],
    },
  },
  {
    slot: 'mid',
    colors: [
      {
        color: 'red',
        emblems: 1,
        tiers: {
          top: ['gpm', 'creepScore', 'kills'],
          mid: ['deaths'],
          bad: ['madstone'],
        },
      },
      {
        color: 'blue',
        emblems: 1,
        tiers: {
          top: ['runes'],
          mid: ['watchers'],
          bad: ['wardsPlaced', 'campsStacked'],
        },
      },
      {
        color: 'green',
        emblems: 1,
        tiers: {
          top: ['teamfight'],
          mid: ['stuns'],
          bad: ['firstBlood', 'courier'],
        },
      },
    ],
    overall: {
      top: ['gpm', 'runes', 'teamfight', 'kills'],
      mid: ['creepScore', 'watchers', 'stuns'],
      bad: ['wardsPlaced', 'madstone'],
    },
  },
  {
    slot: 'support',
    colors: [
      { color: 'red', emblems: 0, noteKey: 'guideNoteSupportRed' },
      {
        color: 'blue',
        emblems: 2,
        tiers: {
          top: ['wardsPlaced', 'campsStacked', 'smokes'],
          mid: ['lotuses'],
          // A tabela original tambem lista "Lascas" aqui. Madstone e stat
          // VERMELHA — nao existe emblema azul que possa cair nela, entao
          // renderizar seria mostrar algo impossivel no cliente.
          bad: ['runes'],
        },
      },
      {
        color: 'green',
        emblems: 1,
        tiers: {
          top: ['teamfight', 'stuns'],
          mid: [],
          bad: ['tormentor', 'firstBlood'],
        },
      },
    ],
    overall: {
      top: ['wardsPlaced', 'teamfight', 'stuns'],
      mid: ['campsStacked', 'smokes', 'lotuses'],
      bad: ['tormentor', RNG, 'runes'],
    },
  },
];
