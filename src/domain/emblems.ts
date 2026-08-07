import type { EmblemColor, StatId } from './stats';
import type { Period, RoleSlot } from './roles';

export type QualityTier = 1 | 2 | 3 | 4 | 5;

/**
 * `none` NAO e um traco do jogo — e o estado "ainda nao rolado", usado no modo
 * Planejamento e pra reproduzir o estandarte de referencia do battlepass (que
 * tambem e sem tracos). Contribui zero em si e zero nos vizinhos.
 */
export type TraitId = 'fractal' | 'benevolent' | 'vampiric' | 'unique' | 'friendly' | 'none';

export const ALL_QUALITY_TIERS: readonly QualityTier[] = [1, 2, 3, 4, 5];
/** Os tracos de verdade, os que podem sair num roll. `none` fica de fora de proposito. */
export const ALL_TRAIT_IDS: readonly TraitId[] = ['fractal', 'benevolent', 'vampiric', 'unique', 'friendly'];

/** Bonus da qualidade sobre o valor base daquele emblema. */
export const QUALITY_BONUS: Readonly<Record<QualityTier, number>> = {
  1: 0.10,
  2: 0.30,
  3: 0.60,
  4: 1.00,
  5: 1.50,
};

export const QUALITY_LABEL: Readonly<Record<QualityTier, string>> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
};

export interface TraitDefinition {
  readonly id: TraitId;
  readonly labelPtBr: string;
  /** O que faz no proprio emblema. */
  readonly selfBonus: number;
  /** O que faz nos emblemas ADJACENTES. */
  readonly neighborBonus: number;
  readonly descriptionPtBr: string;
}

/**
 * Tracos. O ponto importante: varios deles dependem do ESTANDARTE INTEIRO, entao
 * emblemas nao sao independentes e a pontuacao tem que ser feita no conjunto.
 */
export const TRAIT_DEFINITIONS: Readonly<Record<TraitId, TraitDefinition>> = {
  fractal: {
    id: 'fractal',
    labelPtBr: 'Fractal',
    selfBonus: 0.60,
    neighborBonus: 0,
    descriptionPtBr: '+60% se todas as qualidades do estandarte forem diferentes.',
  },
  benevolent: {
    id: 'benevolent',
    labelPtBr: 'Benevolente',
    selfBonus: 0,
    neighborBonus: 0.20,
    descriptionPtBr: '+20% nos emblemas vizinhos (nada em si mesmo).',
  },
  vampiric: {
    id: 'vampiric',
    labelPtBr: 'Vampírico',
    selfBonus: 0.50,
    neighborBonus: -0.10,
    descriptionPtBr: '+50% em si, -10% nos vizinhos. Melhor numa ponta: penaliza so um.',
  },
  unique: {
    id: 'unique',
    labelPtBr: 'Único',
    selfBonus: 0.30,
    neighborBonus: 0,
    descriptionPtBr: '+30% se for o unico Unico do estandarte. Dois Unicos = ambos valem zero.',
  },
  friendly: {
    id: 'friendly',
    labelPtBr: 'Amigável',
    selfBonus: 0.50,
    neighborBonus: 0,
    descriptionPtBr: '+50% se houver 3 ou mais Amigaveis. Degrau, nao rampa.',
  },
  none: {
    id: 'none',
    labelPtBr: 'Sem traco',
    selfBonus: 0,
    neighborBonus: 0,
    descriptionPtBr: 'Ainda nao rolado. Nao existe no jogo — e o estado neutro do planejamento.',
  },
};

/** Emblema totalmente rolado — modo "Meu Estandarte". */
export interface Emblem {
  /** Posicao no estandarte. Adjacencia e |i - j| === 1 no modo 'line'. */
  readonly index: number;
  readonly color: EmblemColor;
  readonly statId: StatId;
  readonly quality: QualityTier;
  readonly trait: TraitId;
}

/** Plano pre-roll: so a stat escolhida; qualidade e traco ainda desconhecidos. */
export type EmblemPlan = Pick<Emblem, 'index' | 'color' | 'statId'>;

export interface Banner {
  readonly slot: RoleSlot;
  readonly period: Period;
  readonly emblems: readonly Emblem[];
}

export interface BannerPlan {
  readonly slot: RoleSlot;
  readonly period: Period;
  readonly emblems: readonly EmblemPlan[];
}
