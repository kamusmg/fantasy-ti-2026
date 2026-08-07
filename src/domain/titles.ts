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
  crimson: { id: 'crimson', labelPtBr: 'Carmesim', bonus: 0.06, conditionPtBr: 'heroi vermelho' },
  cerulean: { id: 'cerulean', labelPtBr: 'Ceruleo', bonus: 0.11, conditionPtBr: 'heroi azul' },
  emerald: { id: 'emerald', labelPtBr: 'Esmeralda', bonus: 0.06, conditionPtBr: 'heroi verde' },
  royal: { id: 'royal', labelPtBr: 'Real', bonus: 0.10, conditionPtBr: 'heroi roxo' },
  golden: { id: 'golden', labelPtBr: 'Dourado', bonus: 0.08, conditionPtBr: 'heroi amarelo ou marrom' },
  elemental: { id: 'elemental', labelPtBr: 'Elemental', bonus: 0.08, conditionPtBr: 'heroi Aquatico, Igneo ou Gelido' },
  otherworldly: { id: 'otherworldly', labelPtBr: 'Sobrenatural', bonus: 0.07, conditionPtBr: 'heroi Morto-vivo, Demonio ou Espirito' },
  heroic: { id: 'heroic', labelPtBr: 'Heroico', bonus: 0.09, conditionPtBr: 'heroi de Capa ou Mascara' },
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
    labelPtBr: 'o Decisivo',
    bonus: 0.16,
    perMapProbability: 0.500,
    probabilityBasis: 'derived-battlepass',
    conditionPtBr: 'ultima partida possivel da serie',
    notePtBr: 'Exatamente 1 dos 2 mapas contados. Melhor sufixo pelas duas fontes.',
  },
  lucky: {
    id: 'lucky',
    labelPtBr: 'o Sortudo',
    bonus: 0.21,
    perMapProbability: 0.098,
    probabilityBasis: 'derived-battlepass',
    conditionPtBr: 'duracao da partida termina em 8',
  },
  underdog: {
    id: 'underdog',
    labelPtBr: 'o Azarao',
    bonus: 0.06,
    perMapProbability: 0.524,
    probabilityBasis: 'team-dependent',
    conditionPtBr: 'partidas em que o jogador PERDE',
    notePtBr: 'Depende do time: elenco mais fraco perde mais e dispara mais. 0,524 e a media da liga.',
  },
  tormented: {
    id: 'tormented',
    labelPtBr: 'o Atormentado',
    bonus: 0.23,
    perMapProbability: 0.02,
    probabilityBasis: 'assumed',
    conditionPtBr: 'algum jogador morre pro Tormentor',
    notePtBr: 'Raríssimo em jogo profissional.',
  },
  flayedTwinsAcolyte: {
    id: 'flayedTwinsAcolyte',
    labelPtBr: 'Acolito dos Gemeos Esfolados',
    bonus: 0.09,
    perMapProbability: 0.05,
    probabilityBasis: 'assumed',
    conditionPtBr: 'first blood antes do gongo inicial',
  },
  patient: {
    id: 'patient',
    labelPtBr: 'o Paciente',
    bonus: 0.23,
    perMapProbability: 0.03,
    probabilityBasis: 'assumed',
    conditionPtBr: 'nenhum first blood ate os 10:00',
  },
  decisive: {
    id: 'decisive',
    labelPtBr: 'o Resoluto',
    bonus: 0.24,
    perMapProbability: 0.02,
    probabilityBasis: 'assumed',
    conditionPtBr: 'partida abaixo de 25 minutos',
    notePtBr: 'Quase nao acontece no TI.',
  },
  cruel: {
    id: 'cruel',
    labelPtBr: 'o Cruel',
    bonus: 0.13,
    perMapProbability: 0.05,
    probabilityBasis: 'assumed',
    conditionPtBr: 'um jogador e morto na propria fonte',
  },
};

export interface CoachTitle {
  readonly prefix: PrefixId | null;
  readonly suffix: SuffixId | null;
}
