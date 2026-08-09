import { COLOR_LABEL_PT_BR, STAT_DEFINITIONS } from '../domain/stats';
import type { EmblemColor, StatId } from '../domain/stats';
import { ROLE_LABEL_PT_BR } from '../domain/roles';
import type { RoleSlot } from '../domain/roles';
import { BUCKET_LABEL_PT_BR } from '../engine/swiss';
import type { Bucket } from '../engine/swiss';
import { PREFIX_DEFINITIONS, SUFFIX_DEFINITIONS } from '../domain/titles';
import { TRAIT_DEFINITIONS } from '../domain/emblems';
import type { TraitId } from '../domain/emblems';
import type { PrefixId, SuffixId } from '../domain/titles';

export type Lang = 'pt' | 'en';

/**
 * Textos das duas telas.
 *
 * Sem biblioteca de i18n: sao ~40 chaves numa tela so, e uma dependencia a mais
 * seria mais peso do que ajuda. O tipo garante que nenhuma chave fique so num
 * idioma — se faltar, o TypeScript reclama.
 */
interface Strings {
  readonly dreamTitle: string;
  readonly predictionsTitle: string;
  readonly groupStage: string;
  readonly locksIn: string;
  readonly pos: string;
  readonly keepOnBanner: string;
  readonly rerollAnythingElse: string;
  readonly coachTitle: string;
  readonly when: string;
  readonly tokensTitle: string;
  readonly spendOn: string;
  readonly tokensYield: (pct: string) => string;
  readonly tokensWhy: (color: string, stat: string, times: string) => string;
  readonly tokensWhyFlat: (color: string, role: string) => string;
  readonly greenRule: (green: string, red: string, blue: string) => string;
  readonly fractalWarnLead: string;
  readonly fractalWarnBody: string;
  readonly simulations: (n: string) => string;
  readonly firmPicks: string;
  readonly firmSubtitle: string;
  readonly outOf16: string;
  readonly expectedHits: string;
  readonly vsRandom: (n: string) => string;
  readonly aboveRandom: (pct: string) => string;
  readonly ceilingLead: string;
  readonly ceilingBody: string;
  readonly weakestLead: string;
  readonly weakestBody: string;
  readonly badgeFirm: string;
  readonly badgeLikely: string;
  readonly badgeGuess: string;
  readonly whosePicks: string;
  readonly ourModelName: string;
  readonly modelSource: string;
  readonly weSay: string;
  readonly sameAsUs: string;
  readonly agreesWithUs: (n: number) => string;
  readonly scoresAgainst: (theirs: string, ours: string) => string;
  readonly comparePrompt: string;
  readonly compareTitle: string;
  readonly compareNone: string;
  readonly compareMore: (n: number) => string;
  readonly compareNeedsAuthor: string;
  readonly traitTargetLead: string;
  readonly tierV: string;
  readonly tiersDistinct: string;
  readonly tiersRepeated: string;
  readonly eachEmblem: string;
  readonly bucketSubtitle: Readonly<Record<Bucket, string>>;

  // ---------- tela do Guia ----------
  readonly guideTitle: string;
  readonly guideSubtitle: string;
  readonly bannerOrder: string;
  readonly guideMeasuredOn: string;
  /** Opcao PADRAO do seletor de equipe: a regra geral, nao um caso. */
  readonly leagueAverage: string;
  readonly leagueAverageNote: string;
  /**
   * Selo de troca de elenco. Sem ele a tela mente por omissao: mostra numero de
   * media da liga debaixo do nome de uma equipe, como se fosse dela.
   */
  readonly rosterChangeChip: string;
  readonly rosterChangeNote: (out: string, entrou: string, date: string) => string;
  /** Selo de empate tecnico: N atributos do topo dentro de 10% um do outro. */
  readonly tieLabel: (n: number) => string;
  readonly guideColorAbsent: string;
  readonly verdictLabel: Readonly<Record<'guardar' | 'aceitavel' | 'rerolar', string>>;
  readonly guideFooterLead: string;
  readonly guideFooterBody: string;

  // ---------- tela de Tracos e Qualidades ----------
  readonly traitsTitle: string;
  /** Rotulo curto da aba. O titulo inteiro nao cabe na barra com cinco cenas. */
  readonly guideTab: string;
  readonly traitsTab: string;
  readonly traitsSubtitle: string;
  readonly qualityTitle: string;
  readonly qualityNote: string;
  readonly tierWord: string;
  readonly traitWord: string;
  readonly emblemWord: string;
  readonly baseWord: string;
  readonly neighboursWord: string;
  readonly simTitle: string;
  readonly simHowTo: string;
  readonly bannerTotal: string;
  readonly bannerTotalNote: string;
  readonly onItself: string;
  readonly onNeighbours: string;
  /** Conjuncao pra juntar dois nomes: 'Satanic E Noticed'. */
  readonly andWord: string;
  readonly noTitleChosen: string;
  readonly bannerConditions: string;
  readonly condFractal: (tiers: string) => string;
  readonly condUnique: (n: number) => string;
  readonly condFriendly: (n: number) => string;

  // ---------- ranking de montagens: seguranca x teto ----------
  readonly rankingTitle: string;
  readonly safestTitle: string;
  readonly ceilingTitle: string;
  readonly avoidTitle: string;
  readonly safest: readonly AdviceItem[];
  readonly ceiling: readonly AdviceItem[];
  readonly avoid: Readonly<Record<AvoidId, string>>;
}

/** Um item do ranking: o nome da montagem em negrito, e por que ela e assim. */
interface AdviceItem {
  readonly lead: string;
  readonly body: string;
}

/**
 * Os quatro erros do "Evite".
 *
 * Sao ID e nao posicao numa lista porque o simulador ACENDE o que estiver
 * acontecendo agora no estandarte montado — e casar texto com regra por indice
 * quebra calado no dia em que alguem reordenar a lista.
 */
export type AvoidId = 'friendlyIncomplete' | 'twoUniques' | 'fractalRepeated' | 'vampiricMiddle';

const PT: Strings = {
  dreamTitle: 'DOTA DOS SONHOS',
  predictionsTitle: 'PALPITES',
  groupStage: 'FASE DE GRUPOS',
  locksIn: 'FECHA EM',
  pos: 'POS',
  keepOnBanner: 'NO ESTANDARTE, FIQUE COM',
  rerollAnythingElse: 'qualquer outro atributo nessa cor: renove',
  coachTitle: 'TÍTULO DE TREINADOR',
  when: 'quando',
  tokensTitle: 'AS 40 FICHAS DE RENOVAÇÃO',
  spendOn: 'Gaste no',
  tokensYield: (pct) => `Rende +${pct}%, o dobro das outras duas funções.`,
  tokensWhy: (color, stat, times) =>
    `No ${color} do Meio a sorte PESA: ${stat} vale ${times}× o segundo melhor — saiu outra coisa e o emblema quase não pontua.`,
  tokensWhyFlat: (color, role) =>
    `Já no ${color} do ${role}, quatro das seis opções são boas — sair mal quase não dói, então ficha ali compra pouco.`,
  greenRule: (green, red, blue) =>
    `Atributo ruim só tem conserto direto em emblema ${green}. No ${red} você só mira qualidade, no ${blue} só traço.`,
  fractalWarnLead: 'Cuidado com o FRACTAL:',
  fractalWarnBody: 'se ele estiver no estandarte, subir uma qualidade pode baixar sua nota. Ele só paga com as três qualidades diferentes.',
  simulations: (n) => `${n} simulações do Suíço`,
  firmPicks: 'palpites FIRMES',
  firmSubtitle: 'não mudam por mais que eu mexa no modelo',
  outOf16: 'de 16',
  expectedHits: 'acertos esperados',
  vsRandom: (n) => `contra ${n} no chute`,
  aboveRandom: (pct) => `${pct}% acima de sortear as 16 equipes nas vagas`,
  ceilingLead: 'Por que o teto é baixo:',
  ceilingBody: 'dez das 16 equipes caem na rodada eliminatória, e ganhar ou perder lá é quase cara-ou-coroa. Essas dez vagas não rendem por mais que se calcule — nem pra mim, nem pra ninguém.',
  weakestLead: 'são os mais fracos:',
  weakestBody: 'mexendo na calibração eles trocam de dono. Por isso vão marcados como CHUTE.',
  badgeFirm: 'FIRME',
  badgeLikely: 'PROVÁVEL',
  badgeGuess: 'CHUTE',
  whosePicks: 'PALPITE DE',
  ourModelName: 'Claude Opus',
  modelSource: '50.000 simulações do Suíço com força de equipe do mercado de apostas',
  weSay: 'Claude',
  sameAsUs: 'igual ao nosso',
  agreesWithUs: (n) => `${n} de 16 iguais aos do Claude`,
  scoresAgainst: (theirs, ours) => `acerta ${theirs} contra ${ours} do Claude Opus, pelo nosso modelo.`,
  comparePrompt: 'Aperte C pra ver onde os dois discordam, e o que o modelo acha de cada lado.',
  compareTitle: 'ONDE OS DOIS DISCORDAM',
  compareNone: 'Nenhuma discordância: os 16 palpites são idênticos aos nossos.',
  compareMore: (n) => `+${n} discordância${n > 1 ? 's' : ''} menor${n > 1 ? 'es' : ''}`,
  compareNeedsAuthor: 'escolha outro autor para comparar',
  traitTargetLead: 'ALVO DE RENOVAÇÃO:',
  tierV: 'tudo Nível V',
  tiersDistinct: 'níveis TODOS diferentes ->',
  tiersRepeated: 'dois ou mais REPETIDOS ->',
  eachEmblem: 'em cada emblema',
  bucketSubtitle: {
    '4-0': 'Uma equipe invicta.',
    '4-1': 'Duas equipes com quatro vitórias e uma derrota.',
    elimWin: 'As cinco equipes vencedoras da rodada eliminatória.',
    elimLose: 'As cinco equipes perdedoras da rodada eliminatória.',
    '1-4': 'Duas equipes com uma vitória e quatro derrotas.',
    '0-4': 'Uma equipe sem vitórias.',
  },

  guideTitle: 'GUIA DE ATRIBUTOS',
  guideSubtitle: 'os 18 atributos em ordem de valor — 100% = o melhor da cor · abre na média da liga',
  bannerOrder: 'ORDEM DO ESTANDARTE',
  guideMeasuredOn: 'medido em',
  leagueAverage: 'MÉDIA DA LIGA',
  leagueAverageNote: '2.888 replays de 14 ligas — a regra geral, sem equipe nenhuma',
  rosterChangeChip: 'SEM DADO PRÓPRIO',
  rosterChangeNote: (out, entrou, date) =>
    `${entrou} entrou no lugar de ${out} em ${date}. As duas fontes mediram ${out}, então os números desta função são a MÉDIA DA LIGA, não os desta equipe.`,
  tieLabel: (n) => `EMPATE ×${n}`,
  guideColorAbsent: 'Esta função não tem emblema desta cor no estandarte.',
  verdictLabel: { guardar: 'GUARDAR', aceitavel: 'ACEITÁVEL', rerolar: 'RENOVAR' },
  guideFooterLead: 'A cor vem TRAVADA pela função.',
  guideFooterBody:
    'Você não escolhe a cor do emblema nem o atributo que cai nele — a lista diz o que MANTER e o que renovar. O bloco apagado é a cor que aquela função NÃO tem: o Principal não tem azul, o Suporte não tem vermelho. Os atributos na faixa verde estão EMPATADOS: a diferença entre eles é menor que o erro do modelo, então ali não existe "o melhor" — fique com o que caiu.',

  traitsTitle: 'MEU ESTANDARTE',
  guideTab: 'ATRIBUTOS',
  traitsTab: 'ESTANDARTE',
  traitsSubtitle: 'a mesma conta do cliente, com o que caiu pra você',
  qualityTitle: 'NÍVEL',
  qualityNote: 'multiplica o valor base daquele emblema. Vem sorteada.',
  tierWord: 'NÍVEL',
  traitWord: 'TRAÇO',
  emblemWord: 'EMBLEMA',
  baseWord: 'base do atributo',
  neighboursWord: 'dos vizinhos',
  simTitle: 'MONTE O ESTANDARTE QUE SAIU',
  simHowTo: 'Escolha o nível e o traço de cada emblema, do jeito que caíram no seu jogo. A porcentagem sai na hora, pela mesma conta do cliente — e serve pra testar um roll ANTES de gastar a ficha.',
  bannerTotal: 'SOMA DOS TRÊS',
  andWord: 'e',
  noTitleChosen: 'esta pessoa não escolheu título',
  bannerConditions: 'CONDIÇÕES DO ESTANDARTE',
  condFractal: (tiers) => `Fractal — níveis ${tiers}`,
  condUnique: (n) => `Único — ${n} no estandarte`,
  condFriendly: (n) => `Amigável — ${n} de 3`,
  onItself: 'no próprio emblema',
  onNeighbours: 'nos vizinhos',
  bannerTotalNote: 'Só serve pra comparar estandartes entre si — não é a sua pontuação.',

  rankingTitle: 'POR SEGURANÇA E POR TETO',
  safestTitle: 'MAIS SEGURAS',
  ceilingTitle: 'MAIOR TETO, MAIOR CONDIÇÃO',
  avoidTitle: 'EVITE',
  safest: [
    { lead: 'Vampírico na ponta', body: 'cobra de um vizinho só, não de dois.' },
    { lead: 'Benevolente no meio', body: 'daí ele alcança os dois vizinhos.' },
    { lead: 'Um Único só', body: 'a condição mais fácil de manter ligada.' },
  ],
  ceiling: [
    { lead: 'Três Amigáveis', body: 'o pacote mais forte, mas exige os TRÊS.' },
    { lead: 'Fractal ligado', body: 'ótimo se os níveis já caíram diferentes.' },
    { lead: 'Vampírico no melhor atributo', body: 'aposta tudo num emblema só.' },
  ],
  avoid: {
    friendlyIncomplete: 'Amigável incompleto: 1 ou 2 valem ZERO',
    twoUniques: 'Dois Únicos: os DOIS zeram, não só o segundo',
    fractalRepeated: 'Fractal com dois níveis repetidos',
    vampiricMiddle: 'Vampírico no meio, cobrando dos dois vizinhos',
  },
};

const EN: Strings = {
  dreamTitle: 'DREAM TEAM',
  predictionsTitle: 'PREDICTIONS',
  groupStage: 'GROUP STAGE',
  locksIn: 'LOCKS IN',
  pos: 'POS',
  keepOnBanner: 'ON THE BANNER, KEEP',
  rerollAnythingElse: 'any other stat in that colour: reroll it',
  coachTitle: 'COACH TITLE',
  when: 'when',
  tokensTitle: 'YOUR 40 TOKENS',
  spendOn: 'Spend on',
  tokensYield: (pct) => `Worth +${pct}%, double the other two roles.`,
  tokensWhy: (color, stat, times) =>
    `On Mid's ${color}, luck MATTERS: ${stat} is worth ${times}× the next best — roll anything else and the emblem barely scores.`,
  tokensWhyFlat: (color, role) =>
    `On ${role}'s ${color}, four of the six options are good — a bad roll barely hurts, so tokens buy little there.`,
  greenRule: (green, red, blue) =>
    `A bad stat can only be fixed directly on a ${green} emblem. On ${red} you can only target quality, on ${blue} only the trait.`,
  fractalWarnLead: 'Watch out for FRACTAL:',
  fractalWarnBody: 'with it on the banner, RAISING a quality can LOWER your score. It only pays when all three qualities differ.',
  simulations: (n) => `${n} Swiss simulations`,
  firmPicks: 'FIRM picks',
  firmSubtitle: "they don't move no matter how I tweak the model",
  outOf16: 'of 16',
  expectedHits: 'expected hits',
  vsRandom: (n) => `vs ${n} guessing`,
  aboveRandom: (pct) => `${pct}% better than drawing the 16 teams at random`,
  ceilingLead: 'Why the ceiling is low:',
  ceilingBody: 'ten of the 16 teams land in the elimination round, and winning or losing there is close to a coin flip. Those ten slots pay off for nobody — not for me, not for anyone.',
  weakestLead: 'are the weakest:',
  weakestBody: 'change the calibration and they swap owners. That is why they are tagged GUESS.',
  badgeFirm: 'FIRM',
  badgeLikely: 'LIKELY',
  badgeGuess: 'GUESS',
  whosePicks: 'PICKS BY',
  ourModelName: 'Claude Opus',
  modelSource: '50,000 Swiss simulations with team strength from the betting market',
  weSay: 'Claude',
  sameAsUs: 'same as ours',
  agreesWithUs: (n) => `${n} of 16 match Claude's`,
  scoresAgainst: (theirs, ours) => `scores ${theirs} against Claude Opus's ${ours}, by our model.`,
  comparePrompt: 'Press C to see where the two disagree, and what the model thinks of each side.',
  compareTitle: 'WHERE THE TWO DISAGREE',
  compareNone: 'No disagreements: all 16 picks are identical to ours.',
  compareMore: (n) => `+${n} smaller disagreement${n > 1 ? 's' : ''}`,
  compareNeedsAuthor: 'pick another author to compare',
  traitTargetLead: 'ROLL TARGET:',
  tierV: 'all Tier V',
  tiersDistinct: 'all tiers DIFFERENT ->',
  tiersRepeated: 'two or more REPEATED ->',
  eachEmblem: 'on every emblem',
  bucketSubtitle: {
    '4-0': 'One undefeated team.',
    '4-1': 'Two teams with four wins and one loss.',
    elimWin: 'The five teams that win the elimination round.',
    elimLose: 'The five teams that lose the elimination round.',
    '1-4': 'Two teams with one win and four losses.',
    '0-4': 'One team without a win.',
  },

  guideTitle: 'STAT GUIDE',
  guideSubtitle: 'all 18 stats ranked by value — 100% = best of that colour · opens on the league average',
  bannerOrder: 'BANNER ORDER',
  guideMeasuredOn: 'measured on',
  leagueAverage: 'LEAGUE AVERAGE',
  leagueAverageNote: '2,888 replays across 14 leagues — the general rule, no team involved',
  rosterChangeChip: 'NO OWN DATA',
  rosterChangeNote: (out, entrou, date) =>
    `${entrou} replaced ${out} on ${date}. Both sources measured ${out}, so the numbers for this role are the LEAGUE AVERAGE, not this team\'s.`,
  tieLabel: (n) => `TIE ×${n}`,
  guideColorAbsent: 'This role has no emblem of this colour on its banner.',
  verdictLabel: { guardar: 'KEEP', aceitavel: 'ACCEPTABLE', rerolar: 'REROLL' },
  guideFooterLead: 'The colour is LOCKED by the role.',
  guideFooterBody:
    'You pick neither the emblem colour nor the stat that lands on it — the list says what to KEEP and what to reroll. The dimmed block is the colour that role does NOT have: Core has no blue, Support has no red. The stats inside the green band are TIED: the gap between them is smaller than the model\'s own error, so there is no "best" there — keep whatever you rolled.',

  traitsTitle: 'MY WAR BANNER',
  guideTab: 'STATS',
  traitsTab: 'BANNER',
  traitsSubtitle: "the client's own maths, with whatever you rolled",
  qualityTitle: 'TIER',
  qualityNote: "multiplies that emblem's base value. It is rolled, not chosen.",
  tierWord: 'TIER',
  traitWord: 'TRAIT',
  emblemWord: 'EMBLEM',
  baseWord: 'stat base',
  neighboursWord: 'from neighbours',
  simTitle: 'BUILD THE BANNER YOU ROLLED',
  simHowTo: 'Pick the tier and trait of each emblem, exactly as they came up in your game. The percentage updates live, using the same maths as the client — so you can test a roll BEFORE spending the token.',
  bannerTotal: 'SUM OF THE THREE',
  andWord: 'and',
  noTitleChosen: 'this person picked no title',
  bannerConditions: 'BANNER-WIDE CONDITIONS',
  condFractal: (tiers) => `Fractal — tiers ${tiers}`,
  condUnique: (n) => `Unique — ${n} on the banner`,
  condFriendly: (n) => `Friendly — ${n} of 3`,
  onItself: 'on itself',
  onNeighbours: 'on neighbours',
  bannerTotalNote: 'Only useful to compare banners against each other — it is not your score.',

  rankingTitle: 'BY SAFETY AND BY CEILING',
  safestTitle: 'SAFEST',
  ceilingTitle: 'HIGHER CEILING, HARDER CONDITION',
  avoidTitle: 'AVOID',
  safest: [
    { lead: 'Vampiric on an end', body: 'it taxes one neighbour, not two.' },
    { lead: 'Benevolent in the middle', body: 'from there it reaches both neighbours.' },
    { lead: 'A single Unique', body: 'the easiest condition to keep switched on.' },
  ],
  ceiling: [
    { lead: 'Three Friendly', body: 'the strongest package, but it needs all THREE.' },
    { lead: 'Fractal switched on', body: 'great if the tiers already came up different.' },
    { lead: 'Vampiric on your best stat', body: 'stakes everything on one emblem.' },
  ],
  avoid: {
    friendlyIncomplete: 'An incomplete Friendly: 1 or 2 are worth ZERO',
    twoUniques: 'Two Uniques: BOTH go to zero, not just the second',
    fractalRepeated: 'Fractal with two repeated tiers',
    vampiricMiddle: 'Vampiric in the middle, taxing both neighbours',
  },
};

export const STRINGS: Readonly<Record<Lang, Strings>> = { pt: PT, en: EN };

// ---------- rotulos de dominio ----------

const ROLE_LABEL_EN: Readonly<Record<RoleSlot, string>> = {
  core: 'Core',
  mid: 'Mid',
  support: 'Support',
};

const COLOR_LABEL_EN: Readonly<Record<EmblemColor, string>> = {
  red: 'Red',
  blue: 'Blue',
  green: 'Green',
};

const BUCKET_LABEL_EN: Readonly<Record<Bucket, string>> = {
  '4-0': '4-0',
  '4-1': '4-1',
  elimWin: 'Elimination Round Winner',
  elimLose: 'Elimination Round Loser',
  '1-4': '1-4',
  '0-4': '0-4',
};

/** Prefixos e sufixos: em ingles usamos o nome que o proprio cliente mostra. */
const PREFIX_LABEL_EN: Readonly<Record<PrefixId, string>> = {
  crimson: 'Crimson', cerulean: 'Cerulean', emerald: 'Emerald', royal: 'Royal',
  golden: 'Golden', elemental: 'Elemental', otherworldly: 'Otherworldly', heroic: 'Heroic',
};

const SUFFIX_LABEL_EN: Readonly<Record<SuffixId, string>> = {
  clutch: 'the Clutch', lucky: 'the Lucky', underdog: 'the Underdog', tormented: 'the Tormented',
  flayedTwinsAcolyte: 'the Flayed Twins Acolyte', patient: 'the Patient', decisive: 'the Decisive', cruel: 'the Cruel',
};

const PREFIX_CONDITION_EN: Readonly<Record<PrefixId, string>> = {
  crimson: 'a red hero', cerulean: 'a blue hero', emerald: 'a green hero', royal: 'a purple hero',
  golden: 'a yellow or brown hero', elemental: 'an Aquatic, Fiery, or Icy Hero',
  otherworldly: 'an Undead, Demon, or Spirit Hero', heroic: 'a Caped or Masked Hero',
};

const SUFFIX_CONDITION_EN: Readonly<Record<SuffixId, string>> = {
  clutch: 'playing the last possible match of a series',
  lucky: 'the match time ends with an 8',
  underdog: 'the player loses',
  tormented: 'any player dies to a Tormentor',
  flayedTwinsAcolyte: 'any player gets first blood before the starting horn',
  patient: 'first blood does not happen until after 10 minutes',
  decisive: 'the game lasts less than 25 minutes',
  cruel: 'a player is killed while in their own fountain',
};

/** Versao curta pro selo dentro do card — "Vencedora da Eliminatoria" nao cabe em 206px. */
const BUCKET_SHORT: Readonly<Record<Lang, Readonly<Record<Bucket, string>>>> = {
  pt: { '4-0': '4-0', '4-1': '4-1', elimWin: 'Vence elim.', elimLose: 'Perde elim.', '1-4': '1-4', '0-4': '0-4' },
  en: { '4-0': '4-0', '4-1': '4-1', elimWin: 'Elim. win', elimLose: 'Elim. loss', '1-4': '1-4', '0-4': '0-4' },
};

export const label = {
  role: (slot: RoleSlot, lang: Lang) => (lang === 'pt' ? ROLE_LABEL_PT_BR[slot] : ROLE_LABEL_EN[slot]),
  bucketShort: (b: Bucket, lang: Lang) => BUCKET_SHORT[lang][b],
  color: (color: EmblemColor, lang: Lang) => (lang === 'pt' ? COLOR_LABEL_PT_BR[color] : COLOR_LABEL_EN[color]),
  stat: (id: StatId, lang: Lang) => (lang === 'pt' ? STAT_DEFINITIONS[id].labelPtBr : STAT_DEFINITIONS[id].labelEn),
  /** Forma curta, pra lista de varios atributos separados por virgula. */
  trait: (id: TraitId, lang: Lang) => (lang === 'pt' ? TRAIT_DEFINITIONS[id].labelPtBr : TRAIT_DEFINITIONS[id].labelEn),
  statShort: (id: StatId, lang: Lang) => (lang === 'pt' ? STAT_DEFINITIONS[id].shortPtBr : STAT_DEFINITIONS[id].shortEn),
  bucket: (b: Bucket, lang: Lang) => (lang === 'pt' ? BUCKET_LABEL_PT_BR[b] : BUCKET_LABEL_EN[b]),
  prefix: (id: PrefixId, lang: Lang) => (lang === 'pt' ? PREFIX_DEFINITIONS[id].labelPtBr : PREFIX_LABEL_EN[id]),
  suffix: (id: SuffixId, lang: Lang) => (lang === 'pt' ? SUFFIX_DEFINITIONS[id].labelPtBr : SUFFIX_LABEL_EN[id]),
  /**
   * O titulo como o CLIENTE escreve: `{jogador}, o {sufixo} {prefixo}`.
   *
   * A tela mostrava "Ceruleo · o Decisivo" — prefixo primeiro, com um ponto no
   * meio. No jogo le-se "o Decisivo Ceruleo", e o cabecalho do proprio cliente
   * chama o sufixo de "Primeiro" e o prefixo de "Segundo". Em ingles o rotulo do
   * sufixo ja traz o "the" dentro ("the Clutch"), entao o artigo so entra no pt.
   */
  coachTitle: (prefixId: PrefixId | null, suffixId: SuffixId | null, lang: Lang) => {
    const p = prefixId ? label.prefix(prefixId, lang) : null;
    const s = suffixId ? label.suffix(suffixId, lang) : null;
    if (!p && !s) return '—';
    if (lang === 'pt') return [s ? `o ${s}` : null, p].filter(Boolean).join(' ');
    return [s, p].filter(Boolean).join(' ');
  },
  prefixCondition: (id: PrefixId, lang: Lang) =>
    (lang === 'pt' ? PREFIX_DEFINITIONS[id].conditionPtBr : PREFIX_CONDITION_EN[id]),
  suffixCondition: (id: SuffixId, lang: Lang) =>
    (lang === 'pt' ? SUFFIX_DEFINITIONS[id].conditionPtBr : SUFFIX_CONDITION_EN[id]),
};
