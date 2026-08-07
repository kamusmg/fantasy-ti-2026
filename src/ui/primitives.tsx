import type { CSSProperties } from 'react';
import type { Estimate } from '../domain/estimate';
import { PROVENANCE_LABEL_PT_BR } from '../domain/estimate';
import type { ScoreDistribution } from '../domain/results';

export const fmt = (v: number): string => Math.round(v).toLocaleString('pt-BR');

/**
 * Selo de procedencia.
 *
 * Todo numero exibido passa por aqui. A barra mostra o peso empirico-Bayes: o
 * quanto daquele numero e observacao do time e o quanto e media da liga. Assim
 * "amostra pequena" deixa de ser aviso decorativo e vira quantidade na tela.
 */
export function ProvenanceChip({ estimate }: { readonly estimate: Estimate }) {
  const isFallback = estimate.provenance === 'league-mean-fallback';
  const label = isFallback
    ? PROVENANCE_LABEL_PT_BR[estimate.provenance]
    : `${Math.round(estimate.shrinkWeight * 100)}% time`;

  return (
    <span className="chip" data-kind={estimate.provenance} title={estimate.notePtBr ?? PROVENANCE_LABEL_PT_BR[estimate.provenance]}>
      {!isFallback && (
        <span className="chip-bar">
          <i style={{ width: `${Math.round(estimate.shrinkWeight * 100)}%` }} />
        </span>
      )}
      {label}
    </span>
  );
}

/** Faixa p10-p90 com a media marcada. Mostrar a distribuicao, nao so um escalar. */
export function DistributionBar({
  dist,
  min,
  max,
  style,
}: {
  readonly dist: ScoreDistribution;
  readonly min: number;
  readonly max: number;
  readonly style?: CSSProperties;
}) {
  const span = Math.max(1, max - min);
  const pct = (v: number) => `${Math.max(0, Math.min(100, ((v - min) / span) * 100))}%`;

  return (
    <div className="dist-bar" style={style}>
      <div className="dist-range" style={{ left: pct(dist.p10), right: `${100 - parseFloat(pct(dist.p90))}%` }} />
      <div className="dist-mean" style={{ left: pct(dist.mean) }} />
    </div>
  );
}

export function GoldRule({ style }: { readonly style?: CSSProperties }) {
  return <div className="rule-gold" style={style} />;
}
