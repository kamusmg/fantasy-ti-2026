/**
 * As 18 estatisticas do Fantasy do TI 2026 e seus multiplicadores exatos.
 *
 * Procedencia dos multiplicadores: transcricao das capturas do painel "Como Jogar"
 * do cliente (github.com/saalocin/dotaTI2026, TI2026_Rules.md secao 2.5) conferida
 * contra o motor da calculadora do battlepass.ru. As duas fontes sao independentes
 * e batem na casa decimal. Nao existe pagina da Valve com esses numeros.
 */

export type EmblemColor = 'red' | 'blue' | 'green';

export type StatId =
  // vermelho
  | 'kills' | 'deaths' | 'creepScore' | 'gpm' | 'madstone' | 'towerKills'
  // azul
  | 'wardsPlaced' | 'campsStacked' | 'runes' | 'watchers' | 'smokes' | 'lotuses'
  // verde
  | 'roshan' | 'teamfight' | 'stuns' | 'tormentor' | 'firstBlood' | 'courier';

/** Como o cliente converte a estatistica bruta em pontos. Exibicao, nao calculo. */
export type ScoringRule =
  | { readonly kind: 'perUnit'; readonly pointsPerUnit: number }
  | { readonly kind: 'baseMinus'; readonly base: number; readonly perUnit: number }
  | { readonly kind: 'flat'; readonly points: number }
  | { readonly kind: 'capped'; readonly max: number };

export interface StatDefinition {
  readonly id: StatId;
  readonly color: EmblemColor;
  readonly labelPtBr: string;
  readonly labelEn: string;
  readonly rule: ScoringRule;
  /**
   * Evento de credito unico: no maximo um jogador do time leva os pontos.
   *
   * CUIDADO — este campo e EXPLICATIVO, nunca multiplicador. As projecoes que o
   * motor consome ja sao medidas (soma de dupla no Reddit, media de funcao no
   * battlepass), entao a diluicao pela media JA ESTA nos numeros. Aplicar uma
   * divisao por 2 aqui contaria duas vezes e afundaria Roshan/First Blood/courier
   * silenciosamente. Serve so pra explicar na tela por que sao fracos numa dupla.
   */
  readonly soloCredit: boolean;
  /**
   * Coeficiente de variacao por mapa. ASSUMIDO — nenhuma fonte publica desvio padrao.
   *
   * Alimenta a estatistica de ordem (2 melhores mapas da serie, melhor serie do
   * periodo), onde variancia vira media. Numeros altos = estatistica grumosa
   * (Roshan sai 0, 1 ou 2 vezes num mapa); baixos = estavel (Teamfight tem teto).
   */
  readonly assumedCv: number;
}

const def = (
  id: StatId,
  color: EmblemColor,
  labelPtBr: string,
  labelEn: string,
  rule: ScoringRule,
  assumedCv: number,
  soloCredit = false,
): StatDefinition => ({ id, color, labelPtBr, labelEn, rule, assumedCv, soloCredit });

export const STAT_DEFINITIONS: Readonly<Record<StatId, StatDefinition>> = {
  // ---------- VERMELHO ----------
  kills: def('kills', 'red', 'Abates', 'Kills', { kind: 'perUnit', pointsPerUnit: 107 }, 0.55),
  deaths: def('deaths', 'red', 'Poucas Mortes', 'Low Deaths', { kind: 'baseMinus', base: 1950, perUnit: 195 }, 0.35),
  creepScore: def('creepScore', 'red', 'Creep Score', 'Creep Score', { kind: 'perUnit', pointsPerUnit: 3 }, 0.20),
  gpm: def('gpm', 'red', 'GPM', 'GPM', { kind: 'perUnit', pointsPerUnit: 2 }, 0.20),
  madstone: def('madstone', 'red', 'Madstones', 'Madstones', { kind: 'perUnit', pointsPerUnit: 13 }, 0.40),
  towerKills: def('towerKills', 'red', 'Torres', 'Tower Kills', { kind: 'perUnit', pointsPerUnit: 352 }, 0.70),

  // ---------- AZUL ----------
  wardsPlaced: def('wardsPlaced', 'blue', 'Wards Colocadas', 'Wards Placed', { kind: 'perUnit', pointsPerUnit: 117 }, 0.25),
  campsStacked: def('campsStacked', 'blue', 'Acampamentos Empilhados', 'Camps Stacked', { kind: 'perUnit', pointsPerUnit: 234 }, 0.40),
  runes: def('runes', 'blue', 'Runas', 'Runes', { kind: 'perUnit', pointsPerUnit: 141 }, 0.35),
  watchers: def('watchers', 'blue', 'Vigias', 'Watchers', { kind: 'perUnit', pointsPerUnit: 147 }, 0.45),
  smokes: def('smokes', 'blue', 'Smokes Usados', 'Smokes Used', { kind: 'perUnit', pointsPerUnit: 293 }, 0.45),
  lotuses: def('lotuses', 'blue', 'Lotus', 'Lotuses', { kind: 'perUnit', pointsPerUnit: 176 }, 0.50),

  // ---------- VERDE ----------
  roshan: def('roshan', 'green', 'Roshan', 'Roshan', { kind: 'perUnit', pointsPerUnit: 1172 }, 1.10, true),
  teamfight: def('teamfight', 'green', 'Participacao em Combate', 'Teamfight Participation', { kind: 'capped', max: 2124 }, 0.15),
  stuns: def('stuns', 'green', 'Stuns', 'Stuns', { kind: 'perUnit', pointsPerUnit: 10 }, 0.40),
  tormentor: def('tormentor', 'green', 'Tormentor', 'Tormentor', { kind: 'perUnit', pointsPerUnit: 879 }, 0.75),
  firstBlood: def('firstBlood', 'green', 'First Blood', 'First Blood', { kind: 'flat', points: 1934 }, 2.00, true),
  courier: def('courier', 'green', 'Abates de Coruja', 'Courier Kills', { kind: 'perUnit', pointsPerUnit: 703 }, 1.30, true),
} as const;

export const ALL_STAT_IDS: readonly StatId[] = Object.keys(STAT_DEFINITIONS) as StatId[];

export const STATS_BY_COLOR: Readonly<Record<EmblemColor, readonly StatId[]>> = {
  red: ALL_STAT_IDS.filter((id) => STAT_DEFINITIONS[id].color === 'red'),
  blue: ALL_STAT_IDS.filter((id) => STAT_DEFINITIONS[id].color === 'blue'),
  green: ALL_STAT_IDS.filter((id) => STAT_DEFINITIONS[id].color === 'green'),
};

export const COLOR_LABEL_PT_BR: Readonly<Record<EmblemColor, string>> = {
  red: 'Vermelho',
  blue: 'Azul',
  green: 'Verde',
};

/** Texto do rendimento base, pro selo da tela. Nunca e parseado. */
export function describeRule(rule: ScoringRule): string {
  if (rule.kind === 'perUnit') return `+${rule.pointsPerUnit} por unidade`;
  if (rule.kind === 'baseMinus') return `${rule.base} base, -${rule.perUnit} por morte`;
  if (rule.kind === 'flat') return `${rule.points} fixos`;
  return `ate ${rule.max}`;
}
