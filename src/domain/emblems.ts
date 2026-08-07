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
  /** Texto EXATO do cliente. Nao parafrasear: e o que a pessoa le no jogo. */
  readonly descriptionPtBr: string;
  readonly descriptionEn: string;
  /** Nossa leitura pratica — o que a descricao oficial nao diz e decide roll. */
  readonly tipPtBr: string;
  readonly tipEn: string;
  readonly labelEn: string;
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
    descriptionPtBr: 'Concede +60% ao valor do atributo caso todas as qualidades dos emblemas do estandarte sejam diferentes.',
    descriptionEn: '+60% to the stat bonus if all emblem qualities on the War Banner are different.',
    tipPtBr: 'Armadilha: SUBIR uma qualidade pode desligar o Fractal dos três emblemas e baixar a sua nota.',
    tipEn: 'Trap: RAISING a quality can switch Fractal off on all three emblems and lower your score.',
    labelEn: 'Fractal',
  },
  benevolent: {
    id: 'benevolent',
    labelPtBr: 'Benevolente',
    selfBonus: 0,
    neighborBonus: 0.20,
    descriptionPtBr: 'Concede +20% ao valor do atributo dos emblemas adjacentes.',
    descriptionEn: 'Provides a 20% bonus to the stat value of adjacent emblems.',
    tipPtBr: 'Não vale nada em si mesmo. No meio do estandarte alcança dois vizinhos; na ponta, só um.',
    tipEn: 'Worth nothing on itself. In the middle it reaches two neighbours; on an end, only one.',
    labelEn: 'Benevolent',
  },
  vampiric: {
    id: 'vampiric',
    labelPtBr: 'Vampírico',
    selfBonus: 0.50,
    neighborBonus: -0.10,
    descriptionPtBr: 'Concede +50% ao valor do atributo deste emblema, em troca de -10% ao valor do atributo dos emblemas adjacentes.',
    descriptionEn: 'Increases the stat value of this emblem by 50%, but lowers the stat value of adjacent emblems by 10%.',
    tipPtBr: 'Melhor numa PONTA: lá ele penaliza um vizinho só, em vez de dois.',
    tipEn: 'Best on an END emblem: there it penalises one neighbour instead of two.',
    labelEn: 'Vampiric',
  },
  unique: {
    id: 'unique',
    labelPtBr: 'Único',
    selfBonus: 0.30,
    neighborBonus: 0,
    descriptionPtBr: 'Concede +30% ao valor do atributo caso este seja o único emblema "Único" no estandarte.',
    descriptionEn: '+30% to the stat bonus if this is the only Unique emblem on the War Banner.',
    tipPtBr: 'Dois Únicos no estandarte e os DOIS valem zero — não é o segundo que perde, são os dois.',
    tipEn: 'Two Uniques on the banner and BOTH are worth zero — it is not the second one that loses, it is both.',
    labelEn: 'Unique',
  },
  friendly: {
    id: 'friendly',
    labelPtBr: 'Amigável',
    selfBonus: 0.50,
    neighborBonus: 0,
    descriptionPtBr: 'Concede +50% ao valor do atributo caso haja ao menos 3 emblemas "Amigáveis" no estandarte.',
    descriptionEn: '+50% to the stat bonus if there are at least 3 Friendly emblems on the War Banner.',
    tipPtBr: 'Degrau, não rampa: na Fase de Grupos o estandarte tem 3 emblemas, então exige os TRÊS. Com dois já rolados, o terceiro vale +50% em cada um.',
    tipEn: 'A step, not a ramp: the group-stage banner has 3 emblems, so it needs ALL three. With two already rolled, the third is worth +50% on each.',
    labelEn: 'Friendly',
  },
  none: {
    id: 'none',
    labelPtBr: 'Sem traço',
    selfBonus: 0,
    neighborBonus: 0,
    descriptionPtBr: 'Ainda não rolado. Não existe no jogo — é o estado neutro do planejamento.',
    descriptionEn: 'Not rolled yet. Does not exist in game — it is the neutral planning state.',
    tipPtBr: '',
    tipEn: '',
    labelEn: 'No trait',
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
