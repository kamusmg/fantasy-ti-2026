import { COLOR_LABEL_PT_BR, STAT_DEFINITIONS } from '../domain/stats';
import type { EmblemColor, StatId } from '../domain/stats';
import { ROLE_LABEL_PT_BR } from '../domain/roles';
import type { RoleSlot } from '../domain/roles';
import { BUCKET_LABEL_PT_BR } from '../engine/swiss';
import type { Bucket } from '../engine/swiss';
import { PREFIX_DEFINITIONS, SUFFIX_DEFINITIONS } from '../domain/titles';
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
  readonly bucketSubtitle: Readonly<Record<Bucket, string>>;
}

const PT: Strings = {
  dreamTitle: 'DOTA DOS SONHOS',
  predictionsTitle: 'PALPITES',
  groupStage: 'FASE DE GRUPOS',
  locksIn: 'FECHA EM',
  pos: 'POS',
  keepOnBanner: 'NO ESTANDARTE, FIQUE COM',
  rerollAnythingElse: 'qualquer outra stat nessa cor: rerole',
  coachTitle: 'TITULO DE TREINADOR',
  when: 'quando',
  tokensTitle: 'AS 40 FICHAS',
  spendOn: 'Gaste no',
  tokensYield: (pct) => `Rende +${pct}%, o dobro das outras duas funcoes.`,
  tokensWhy: (color, stat, times) =>
    `Porque no ${color} do Meio a sorte PESA: ${stat} vale ${times}x a segunda melhor. Tirou outra coisa, aquele emblema quase nao pontua.`,
  tokensWhyFlat: (color, role) =>
    `Ja no ${color} do ${role}, quatro das seis opcoes sao boas — rolar mal quase nao doi, entao ficha ali compra pouco.`,
  greenRule: (green, red, blue) =>
    `Stat ruim so tem conserto direto em emblema ${green}. No ${red} voce so mira qualidade, no ${blue} so traco.`,
  fractalWarnLead: 'Cuidado com o FRACTAL:',
  fractalWarnBody: 'se ele estiver no estandarte, subir uma qualidade pode baixar sua nota. Ele so paga com as tres qualidades diferentes.',
  simulations: (n) => `${n} simulacoes do Suico`,
  firmPicks: 'palpites FIRMES',
  firmSubtitle: 'nao mudam por mais que eu mexa no modelo',
  outOf16: 'de 16',
  expectedHits: 'acertos esperados',
  vsRandom: (n) => `contra ${n} no chute`,
  aboveRandom: (pct) => `${pct}% acima de sortear os 16 times nas vagas`,
  ceilingLead: 'Por que o teto e baixo:',
  ceilingBody: 'dez dos 16 times caem na rodada eliminatoria, e ganhar ou perder la e quase cara-ou-coroa. Essas dez vagas nao rendem por mais que se calcule — nem pra mim, nem pra ninguem.',
  weakestLead: 'sao os mais fracos:',
  weakestBody: 'mexendo na calibracao eles trocam de dono. Por isso vao marcados como CHUTE.',
  badgeFirm: 'FIRME',
  badgeLikely: 'PROVAVEL',
  badgeGuess: 'CHUTE',
  bucketSubtitle: {
    '4-0': 'Uma equipe invicta.',
    '4-1': 'Duas equipes com quatro vitorias e uma derrota.',
    elimWin: 'As cinco equipes vencedoras da rodada eliminatoria.',
    elimLose: 'As cinco equipes perdedoras da rodada eliminatoria.',
    '1-4': 'Duas equipes com uma vitoria e quatro derrotas.',
    '0-4': 'Uma equipe sem vitorias.',
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
    `Because on Mid's ${color} luck MATTERS: ${stat} is worth ${times}× the next best. Roll anything else and that emblem barely scores.`,
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
  bucketSubtitle: {
    '4-0': 'One undefeated team.',
    '4-1': 'Two teams with four wins and one loss.',
    elimWin: 'The five teams that win the elimination round.',
    elimLose: 'The five teams that lose the elimination round.',
    '1-4': 'Two teams with one win and four losses.',
    '0-4': 'One team without a win.',
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
  flayedTwinsAcolyte: 'Flayed Twins Acolyte', patient: 'the Patient', decisive: 'the Decisive', cruel: 'the Cruel',
};

const PREFIX_CONDITION_EN: Readonly<Record<PrefixId, string>> = {
  crimson: 'red hero', cerulean: 'blue hero', emerald: 'green hero', royal: 'purple hero',
  golden: 'yellow or brown hero', elemental: 'Aquatic, Fiery or Icy hero',
  otherworldly: 'Undead, Demon or Spirit hero', heroic: 'Caped or Masked hero',
};

const SUFFIX_CONDITION_EN: Readonly<Record<SuffixId, string>> = {
  clutch: 'last possible match of a series',
  lucky: 'match duration ends in an 8',
  underdog: 'matches the player LOSES',
  tormented: 'a player dies to the Tormentor',
  flayedTwinsAcolyte: 'first blood before the horn',
  patient: 'no first blood until 10:00',
  decisive: 'match under 25 minutes',
  cruel: 'a player is killed in their own fountain',
};

export const label = {
  role: (slot: RoleSlot, lang: Lang) => (lang === 'pt' ? ROLE_LABEL_PT_BR[slot] : ROLE_LABEL_EN[slot]),
  color: (color: EmblemColor, lang: Lang) => (lang === 'pt' ? COLOR_LABEL_PT_BR[color] : COLOR_LABEL_EN[color]),
  stat: (id: StatId, lang: Lang) => (lang === 'pt' ? STAT_DEFINITIONS[id].labelPtBr : STAT_DEFINITIONS[id].labelEn),
  bucket: (b: Bucket, lang: Lang) => (lang === 'pt' ? BUCKET_LABEL_PT_BR[b] : BUCKET_LABEL_EN[b]),
  prefix: (id: PrefixId, lang: Lang) => (lang === 'pt' ? PREFIX_DEFINITIONS[id].labelPtBr : PREFIX_LABEL_EN[id]),
  suffix: (id: SuffixId, lang: Lang) => (lang === 'pt' ? SUFFIX_DEFINITIONS[id].labelPtBr : SUFFIX_LABEL_EN[id]),
  prefixCondition: (id: PrefixId, lang: Lang) =>
    (lang === 'pt' ? PREFIX_DEFINITIONS[id].conditionPtBr : PREFIX_CONDITION_EN[id]),
  suffixCondition: (id: SuffixId, lang: Lang) =>
    (lang === 'pt' ? SUFFIX_DEFINITIONS[id].conditionPtBr : SUFFIX_CONDITION_EN[id]),
};
