/**
 * Toda projecao numerica do programa e um Estimate.
 *
 * Isso e proposital e estrutural: se o unico jeito de ter um numero e carregando
 * a linhagem dele junto, fica IMPOSSIVEL renderizar numero sem procedencia. E a
 * defesa contra a doenca de reportar confianca que nao foi conquistada.
 */

export type Provenance =
  /** Tabela do u/Maroomm (13 torneios, 1.601 partidas). */
  | 'reddit-maroomm'
  /** Motor da calculadora do battlepass.ru (2.888 replays, 03/08/2026). */
  | 'battlepass-ru'
  /** Nivel do battlepass + delta de time do Reddit, com encolhimento empirico-Bayes. */
  | 'blended'
  /** Sem dado do time: caiu na media da liga. */
  | 'league-mean-fallback'
  /** Nao medido por ninguem. Suposicao explicita nossa. */
  | 'assumed'
  /** Digitado pelo Kamus na tela. */
  | 'user-override';

export const PROVENANCE_LABEL_PT_BR: Readonly<Record<Provenance, string>> = {
  'reddit-maroomm': 'Reddit',
  'battlepass-ru': 'battlepass',
  blended: 'misturado',
  'league-mean-fallback': 'media da liga',
  assumed: 'assumido',
  'user-override': 'voce digitou',
};

export interface Estimate {
  readonly mean: number;
  /** Desvio padrao por mapa. Alimenta a estatistica de ordem — nunca e zero de graca. */
  readonly sd: number;
  /** Mapas observados. null = nao sabemos. */
  readonly sampleMaps: number | null;
  readonly provenance: Provenance;
  /** Peso empirico-Bayes: 0 = so a media da liga, 1 = so a observacao do time. */
  readonly shrinkWeight: number;
  readonly notePtBr?: string;
}

export type WarningCode =
  | 'small-sample'
  | 'league-fallback'
  | 'scale-mismatch'
  | 'unverified-rule'
  | 'no-team-data'
  /** Elenco mudou depois da publicacao das tabelas: o dado de time nao vale mais. */
  | 'roster-change';

export interface DataWarning {
  readonly severity: 'info' | 'warn' | 'critical';
  readonly code: WarningCode;
  readonly messagePtBr: string;
}

export function estimate(
  mean: number,
  sd: number,
  provenance: Provenance,
  sampleMaps: number | null = null,
  shrinkWeight = 1,
  notePtBr?: string,
): Estimate {
  return { mean, sd, sampleMaps, provenance, shrinkWeight, notePtBr };
}

/** Um numero que sabemos ser exato (constante de regra, entrada do usuario). */
export function exact(mean: number, provenance: Provenance = 'assumed'): Estimate {
  return { mean, sd: 0, sampleMaps: null, provenance, shrinkWeight: 1 };
}
