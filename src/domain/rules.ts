import { QUALITY_BONUS } from './emblems';
import type { QualityTier } from './emblems';

/**
 * TODA suposicao nao verificada do projeto mora aqui, num lugar so.
 *
 * Quatro delas sao perguntas em aberto que so o cliente do Dota responde. Estao
 * como flag com preset nomeado justamente pra que a tela consiga mostrar os dois
 * jeitos em vez de escolher em silencio.
 */
export interface ScoringRuleSet {
  readonly id: string;
  readonly labelPtBr: string;

  readonly qualityBonus: Readonly<Record<QualityTier, number>>;

  /**
   * Qualidade e traco somam ou multiplicam sobre a base?
   *
   * FIXADO POR CAPTURA DE TELA: Tier II (+30%) com vizinho Vampirico (-10%) aparece
   * como 120% no cliente. Aditivo da 100+30-10 = 120. Multiplicativo daria
   * 1,30 x 0,90 = 117%. Aditivo vence. Fica como flag mesmo assim.
   */
  readonly traitComposition: 'additive' | 'multiplicative';

  /**
   * O estandarte e uma LINHA (emblema 0 vizinho so do 1) ou um ANEL?
   * Quase certamente linha. Importa porque numa linha de 5 o emblema do meio tem
   * DOIS vizinhos e pode comer dois -10% de Vampirico.
   */
  readonly adjacency: 'line' | 'ring';

  /** Prefixo e sufixo do treinador somam ou multiplicam? Diferenca de ~500 pts. */
  readonly titleComposition: 'additive' | 'multiplicative';

  /**
   * PERGUNTA EM ABERTO #1 — a que mais move a resposta (+-30% em todo total).
   * O periodo soma as series ou fica com a melhor?
   */
  readonly periodAggregation: 'bestSeries' | 'sumSeries';

  /** PERGUNTA EM ABERTO #2 — o emblema aceita qualquer stat da cor, ou um subconjunto por funcao? */
  readonly statPool: 'allOfColor' | 'roleRestricted';

  /** PERGUNTA EM ABERTO #3 — dois emblemas do mesmo estandarte podem levar a mesma stat? */
  readonly allowDuplicateStatsOnBanner: boolean;

  /** PERGUNTA EM ABERTO #4 — Clutch e sempre o jogo 3 ou o jogo decisivo? */
  readonly clutchApplies: 'alwaysGame3' | 'decidingGame';

  /** Quantos mapas da serie contam. Verificado: os 2 melhores. */
  readonly keepBestMapsPerSeries: number;

  /**
   * Correlacao entre as stats dentro do mesmo mapa (partida longa e dominada infla
   * tudo junto). ASSUMIDA. Entra na variancia do estandarte, nao na media.
   */
  readonly intraMapStatCorrelation: number;

  /**
   * Encolher mais forte as stats cuja vantagem de time NAO transfere pro TI.
   *
   * A tabela do Reddit cobre 13 torneios de nivel misto; um time de qualificatoria
   * regional acumula numero bonito contra oposicao fraca. Da pra MEDIR quais stats
   * sofrem disso: comparando o z-score de cada stat entre os times que entraram no
   * top-8 TI-relevante do battlepass e os que ficaram de fora.
   *
   * O resultado medido (ver scripts/schedule-bias.ts):
   *   Meio / Poucas Mortes   -0,60     Principal / Tormentor  -0,98
   *   Principal / Torres     -0,76     Principal / Roshan     -0,62
   * Ou seja: morrer pouco e pegar objetivo de graca sao marcas de oposicao fraca.
   *
   * CUIDADO COM O CONFUNDIMENTO: o top-8 do battlepass e ranqueado pelo estandarte
   * de referencia deles, entao as stats DESSE estandarte separam positivamente por
   * construcao. As positivas nao valem nada. As NEGATIVAS valem: estar fora do
   * estandarte explica separacao zero, nao explica -0,98.
   *
   * Por isso a correcao e assimetrica — so penaliza, nunca premia. Ela reduz a
   * variancia-entre-times TRANSFERIVEL, o que dentro do empirico-Bayes significa
   * simplesmente encolher mais pra media da liga. Nao e gambiarra: e a resposta
   * bayesiana correta a "parte dessa diferenca entre times nao e habilidade".
   */
  readonly applyTransferabilityShrinkage: boolean;

  /**
   * Correlacao entre os dois jogadores de uma dupla, por mapa. ASSUMIDA.
   * Alta pra Teamfight/GPM (mesmo jogo, mesmas brigas), baixa pra Wards vs Camps.
   * Amortece a variancia da dupla em (1+rho)/2 — por isso o Meio, sozinho, guarda
   * variancia cheia e ganha mais com a regra dos 2 melhores mapas.
   */
  readonly intraDuoCorrelation: number;
}

export const DEFAULT_RULES: ScoringRuleSet = {
  id: 'default',
  labelPtBr: 'Padrao (melhor serie)',
  qualityBonus: QUALITY_BONUS,
  traitComposition: 'additive',
  adjacency: 'line',
  titleComposition: 'additive',
  periodAggregation: 'bestSeries',
  statPool: 'allOfColor',
  allowDuplicateStatsOnBanner: false,
  clutchApplies: 'alwaysGame3',
  keepBestMapsPerSeries: 2,
  intraMapStatCorrelation: 0.30,
  intraDuoCorrelation: 0.55,
  applyTransferabilityShrinkage: true,
};

/** O mesmo motor sem a correcao de forca de tabela — pra mostrar os dois lados na tela. */
export const NO_TRANSFERABILITY_RULES: ScoringRuleSet = {
  ...DEFAULT_RULES,
  id: 'noTransferability',
  labelPtBr: 'Sem correcao de forca de tabela',
  applyTransferabilityShrinkage: false,
};

/** O outro lado da pergunta #1. A tela mostra os dois quando nao der pra confirmar. */
export const SUM_SERIES_RULES: ScoringRuleSet = {
  ...DEFAULT_RULES,
  id: 'sumSeries',
  labelPtBr: 'Alternativo (soma as series)',
  periodAggregation: 'sumSeries',
};

/**
 * Modo compatibilidade com o battlepass.ru: sem estatistica de ordem nenhuma,
 * so 2 mapas x nota media. Existe pro teste-oraculo reproduzir os 4 ganhos
 * publicados por eles e validar unidades, mistura, treinador e a regra da media
 * de uma vez so. NAO usar pra decidir escalacao — o motor de verdade e melhor.
 */
export const BATTLEPASS_COMPAT_RULES: ScoringRuleSet = {
  ...DEFAULT_RULES,
  id: 'battlepassCompat',
  labelPtBr: 'Compatibilidade battlepass.ru',
  periodAggregation: 'sumSeries',
  intraMapStatCorrelation: 0,
  intraDuoCorrelation: 1,
  applyTransferabilityShrinkage: false,
};

export const ALL_RULE_SETS: readonly ScoringRuleSet[] = [
  DEFAULT_RULES,
  SUM_SERIES_RULES,
  NO_TRANSFERABILITY_RULES,
  BATTLEPASS_COMPAT_RULES,
];

/** As 4 perguntas em aberto, pro painel de honestidade da tela. */
export interface OpenQuestion {
  readonly rank: number;
  readonly questionPtBr: string;
  readonly impactPtBr: string;
  readonly field: keyof ScoringRuleSet;
}

export const OPEN_QUESTIONS: readonly OpenQuestion[] = [
  {
    rank: 1,
    questionPtBr: 'O periodo soma as series ou pega a melhor?',
    impactPtBr: '+-30% em todo total; inverte a estrategia de variancia.',
    field: 'periodAggregation',
  },
  {
    rank: 2,
    questionPtBr: 'Um emblema aceita qualquer stat da sua cor?',
    impactPtBr: 'Muda o espaco de busca e talvez o otimo.',
    field: 'statPool',
  },
  {
    rank: 3,
    questionPtBr: 'Dois emblemas podem levar a mesma stat?',
    impactPtBr: 'Se sim, Core com GPM dobrado pode ser otimo.',
    field: 'allowDuplicateStatsOnBanner',
  },
  {
    rank: 4,
    questionPtBr: 'Clutch e sempre o jogo 3 ou o jogo decisivo?',
    impactPtBr: '~+-300 pts no melhor sufixo.',
    field: 'clutchApplies',
  },
];
