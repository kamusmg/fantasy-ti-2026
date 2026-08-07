/**
 * Titulo de Treinador: um prefixo + um sufixo, valendo pros 5 jogadores da escalacao.
 * Trocar e de graca e ilimitado ate o fechamento.
 */

export type PrefixId =
  | 'crimson' | 'cerulean' | 'emerald' | 'royal'
  | 'golden' | 'elemental' | 'otherworldly' | 'heroic';

export type SuffixId =
  | 'tormented' | 'flayedTwinsAcolyte' | 'patient' | 'underdog'
  | 'decisive' | 'clutch' | 'lucky' | 'cruel';

export const ALL_PREFIX_IDS: readonly PrefixId[] = [
  'crimson', 'cerulean', 'emerald', 'royal', 'golden', 'elemental', 'otherworldly', 'heroic',
];

export const ALL_SUFFIX_IDS: readonly SuffixId[] = [
  'tormented', 'flayedTwinsAcolyte', 'patient', 'underdog', 'decisive', 'clutch', 'lucky', 'cruel',
];

export interface PrefixDefinition {
  readonly id: PrefixId;
  readonly labelPtBr: string;
  readonly bonus: number;
  readonly conditionPtBr: string;
}

/**
 * Prefixos. A condicao e a "tag" do heroi jogado naquela partida.
 *
 * Nota de modelagem: as frequencias que temos (tabela do Reddit) ja vem agregadas
 * POR PREFIXO, nao por tag de heroi. Entao guardamos frequencia por PrefixId direto,
 * sem inventar uma decomposicao em tags que a fonte nao da.
 */
export const PREFIX_DEFINITIONS: Readonly<Record<PrefixId, PrefixDefinition>> = {
  crimson: { id: 'crimson', labelPtBr: 'Carmesim', bonus: 0.06, conditionPtBr: 'ao jogar com um herói vermelho' },
  cerulean: { id: 'cerulean', labelPtBr: 'Cerúleo', bonus: 0.11, conditionPtBr: 'ao jogar com um herói azul' },
  emerald: { id: 'emerald', labelPtBr: 'Esmeralda', bonus: 0.06, conditionPtBr: 'ao jogar com um herói verde' },
  royal: { id: 'royal', labelPtBr: 'Real', bonus: 0.10, conditionPtBr: 'ao jogar com um herói roxo' },
  golden: { id: 'golden', labelPtBr: 'Dourado', bonus: 0.08, conditionPtBr: 'ao jogar com um herói amarelo ou marrom' },
  elemental: { id: 'elemental', labelPtBr: 'Elemental', bonus: 0.08, conditionPtBr: 'ao jogar com um herói aquático, ardente ou gelado' },
  otherworldly: { id: 'otherworldly', labelPtBr: 'Sobrenatural', bonus: 0.07, conditionPtBr: 'ao jogar com um herói morto-vivo, demônio ou espírito' },
  heroic: { id: 'heroic', labelPtBr: 'Heroico', bonus: 0.09, conditionPtBr: 'ao jogar com um herói com capa ou máscara' },
};

/** De onde saiu a probabilidade do sufixo — isso vai pro selo na tela. */
export type ProbabilityBasis =
  /** Deduzida da engenharia reversa do modelo do battlepass.ru (encaixe exato). */
  | 'derived-battlepass'
  /** Depende da forca do time; vem da simulacao do Suico. */
  | 'team-dependent'
  /** Estimativa qualitativa do guia do Maroomm. Ninguem mediu. */
  | 'assumed';

export interface SuffixDefinition {
  readonly id: SuffixId;
  readonly labelPtBr: string;
  readonly bonus: number;
  /** P(a condicao valer num mapa que conta pontos). */
  readonly perMapProbability: number;
  readonly probabilityBasis: ProbabilityBasis;
  readonly conditionPtBr: string;
  readonly notePtBr?: string;
}

/**
 * Sufixos.
 *
 * As probabilidades de Clutch, Lucky e Underdog nao sao chute: sairam do encaixe
 * do modelo do battlepass.ru nos 4 ganhos que eles publicam. Clutch deu exatamente
 * 0,500 (um dos dois mapas contados) e Lucky deu 0,098, batendo com o "~10%" que
 * eles mesmos declaram. As outras cinco sao ASSUMIDAS a partir da prosa do Maroomm
 * — ninguem mediu, e a tela precisa dizer isso.
 */
export const SUFFIX_DEFINITIONS: Readonly<Record<SuffixId, SuffixDefinition>> = {
  clutch: {
    id: 'clutch',
    labelPtBr: 'Decisivo',
    bonus: 0.16,
    perMapProbability: 0.500,
    probabilityBasis: 'derived-battlepass',
    conditionPtBr: 'ao jogar a última partida possível de uma série',
    notePtBr: 'Exatamente 1 dos 2 mapas contados. Melhor sufixo pelas duas fontes.',
  },
  lucky: {
    id: 'lucky',
    labelPtBr: 'Sortudo',
    bonus: 0.21,
    perMapProbability: 0.098,
    probabilityBasis: 'derived-battlepass',
    conditionPtBr: 'se o relógio da partida terminar em 8',
  },
  underdog: {
    id: 'underdog',
    labelPtBr: 'Azarão',
    bonus: 0.06,
    perMapProbability: 0.524,
    probabilityBasis: 'team-dependent',
    conditionPtBr: 'caso perca a partida',
    notePtBr: 'Depende do time: elenco mais fraco perde mais e dispara mais. 0,524 e a media da liga.',
  },
  tormented: {
    id: 'tormented',
    labelPtBr: 'Atormentado',
    bonus: 0.23,
    perMapProbability: 0.02,
    probabilityBasis: 'assumed',
    conditionPtBr: 'caso algum jogador morra para uma Tormenta',
    notePtBr: 'Raríssimo em jogo profissional.',
  },
  flayedTwinsAcolyte: {
    id: 'flayedTwinsAcolyte',
    labelPtBr: 'Acólito dos Gêmeos Esfolados',
    bonus: 0.09,
    perMapProbability: 0.05,
    probabilityBasis: 'assumed',
    conditionPtBr: 'caso algum jogador consiga a primeira vítima antes do tocar do berrante',
  },
  patient: {
    id: 'patient',
    labelPtBr: 'Paciente',
    bonus: 0.23,
    perMapProbability: 0.03,
    probabilityBasis: 'assumed',
    conditionPtBr: 'caso não haja uma primeira vítima nos primeiros 10 minutos',
  },
  decisive: {
    id: 'decisive',
    labelPtBr: 'Apressado',
    bonus: 0.24,
    perMapProbability: 0.02,
    probabilityBasis: 'assumed',
    conditionPtBr: 'em partidas que durem menos de 25 minutos',
    notePtBr: 'Quase nao acontece no TI.',
  },
  cruel: {
    id: 'cruel',
    labelPtBr: 'Cruel',
    bonus: 0.13,
    perMapProbability: 0.05,
    probabilityBasis: 'assumed',
    conditionPtBr: 'caso um jogador seja morto dentro da própria fonte',
  },
};

export interface CoachTitle {
  readonly prefix: PrefixId | null;
  readonly suffix: SuffixId | null;
}
