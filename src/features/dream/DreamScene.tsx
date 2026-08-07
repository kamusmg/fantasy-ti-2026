import { useEffect, useState } from 'react';
import { useEngine } from '../../state/useEngine';
import { DistributionBar, GoldRule, ProvenanceChip, fmt } from '../../ui/primitives';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR, ROLE_POSITIONS } from '../../domain/roles';
import type { RoleSlot } from '../../domain/roles';
import { COLOR_LABEL_PT_BR, STAT_DEFINITIONS } from '../../domain/stats';
import { PREFIX_DEFINITIONS, SUFFIX_DEFINITIONS } from '../../domain/titles';
import type { RoleCandidate } from '../../engine/optimize';
import type { LoadedData } from '../../data/load';

/** Fechamento da escalacao da Fase de Grupos. */
const LOCK_AT = Date.parse('2026-08-13T02:00:00Z');

function useCountdown(): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(0, LOCK_AT - now);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function RolePanel({
  slot,
  candidate,
  data,
  x,
}: {
  readonly slot: RoleSlot;
  readonly candidate: RoleCandidate;
  readonly data: LoadedData;
  readonly x: number;
}) {
  const team = data.teams.get(candidate.teamId);
  const unit = data.roleUnits.get(`${candidate.teamId}:${slot}`);
  const nicks = (unit?.playerIds ?? []).map((id) => data.players.get(id)?.nick ?? id);

  return (
    <div className="panel" style={{ position: 'absolute', left: x, top: 178, width: 580, height: 616, padding: '22px 26px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="display" style={{ fontSize: 22, fontWeight: 700 }}>{ROLE_LABEL_PT_BR[slot]}</span>
        <span style={{ fontSize: 13, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>
          POS {ROLE_POSITIONS[slot].join(' + ')}
        </span>
      </div>

      <GoldRule style={{ margin: '14px 0 18px' }} />

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--gold-bright)', lineHeight: 1.05 }}>
        {team?.name}
      </div>
      <div style={{ marginTop: 10, fontSize: 19, color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
        {nicks.join('   ·   ')}
      </div>

      <div style={{ marginTop: 26, fontSize: 12, letterSpacing: '0.18em', color: 'var(--text-faint)' }}>
        ESTANDARTE DE GUERRA
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {candidate.emblems.map((emblem) => {
          const def = STAT_DEFINITIONS[emblem.statId];
          return (
            <div className="emblem" key={emblem.index} data-color={def.color}>
              <div style={{ width: 22, fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--gold-dim)' }}>
                {emblem.index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{def.labelPtBr}</div>
                <div style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-faint)', marginTop: 2 }}>
                  {COLOR_LABEL_PT_BR[def.color].toUpperCase()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="numeral" style={{ fontSize: 30, fontWeight: 600, color: 'var(--gold-bright)', lineHeight: 1 }}>
                  {fmt(emblem.total)}
                </div>
                <div style={{ marginTop: 5 }}>
                  <ProvenanceChip estimate={emblem.base} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'absolute', left: 26, right: 26, bottom: 22 }}>
        <GoldRule style={{ marginBottom: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 12, letterSpacing: '0.16em', color: 'var(--text-faint)' }}>NOTA DO PERIODO</span>
          <span className="numeral" style={{ fontSize: 46, fontWeight: 700, color: 'var(--gold)', lineHeight: 0.9 }}>
            {fmt(candidate.perPeriod.mean)}
          </span>
        </div>
        <DistributionBar
          dist={candidate.perPeriod}
          min={candidate.perPeriod.p10 - candidate.perPeriod.sd}
          max={candidate.perPeriod.p90 + candidate.perPeriod.sd}
          style={{ marginTop: 10 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--text-faint)' }}>
          <span>ruim {fmt(candidate.perPeriod.p10)}</span>
          <span>bom {fmt(candidate.perPeriod.p90)}</span>
        </div>
      </div>
    </div>
  );
}

export function DreamScene() {
  const { data, ranked, elapsedMs, candidateCount } = useEngine();
  const countdown = useCountdown();
  const best = ranked[0];

  const prefix = best.title.prefix ? PREFIX_DEFINITIONS[best.title.prefix] : null;
  const suffix = best.title.suffix ? SUFFIX_DEFINITIONS[best.title.suffix] : null;

  return (
    <>
      {/* ---------- cabecalho ---------- */}
      <div style={{ position: 'absolute', top: 46, left: 0, right: 0, textAlign: 'center' }}>
        <div className="display" style={{ fontSize: 15, letterSpacing: '0.42em', color: 'var(--gold-dim)' }}>
          THE INTERNATIONAL 2026 &nbsp;·&nbsp; FASE DE GRUPOS
        </div>
        <div className="display" style={{ fontSize: 46, fontWeight: 700, color: 'var(--gold-bright)', marginTop: 8 }}>
          A Escalacao
        </div>
        <div style={{ marginTop: 10, fontSize: 13, letterSpacing: '0.2em', color: 'var(--text-faint)' }}>
          FECHA EM <span className="numeral" style={{ color: 'var(--warn)', fontSize: 17 }}>{countdown}</span>
        </div>
      </div>

      {/* ---------- tres funcoes ---------- */}
      {ALL_ROLE_SLOTS.map((slot, i) => (
        <RolePanel key={slot} slot={slot} candidate={best.perRole[slot]} data={data} x={60 + i * 610} />
      ))}

      {/* ---------- treinador + total ---------- */}
      <div className="panel" style={{ position: 'absolute', left: 60, top: 822, width: 1190, height: 176, padding: '20px 26px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--text-faint)' }}>TITULO DE TREINADOR</div>
        <div className="display" style={{ fontSize: 34, color: 'var(--gold-bright)', marginTop: 8 }}>
          {prefix?.labelPtBr ?? '—'} <span style={{ color: 'var(--gold-dim)' }}>·</span> {suffix?.labelPtBr ?? '—'}
        </div>
        <div style={{ display: 'flex', gap: 44, marginTop: 16 }}>
          {prefix && (
            <div>
              <div style={{ fontSize: 15, color: 'var(--text-dim)' }}>
                <b style={{ color: 'var(--gold)' }}>+{Math.round(prefix.bonus * 100)}%</b> quando {prefix.conditionPtBr}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                calculado sobre os 5 jogadores DESTA escalacao, nao pela media da liga
              </div>
            </div>
          )}
          {suffix && (
            <div>
              <div style={{ fontSize: 15, color: 'var(--text-dim)' }}>
                <b style={{ color: 'var(--gold)' }}>+{Math.round(suffix.bonus * 100)}%</b> quando {suffix.conditionPtBr}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                {suffix.probabilityBasis === 'derived-battlepass'
                  ? `dispara em ${Math.round(suffix.perMapProbability * 100)}% dos mapas contados`
                  : suffix.notePtBr ?? 'probabilidade assumida'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="panel" style={{ position: 'absolute', left: 1282, top: 822, width: 578, height: 176, padding: '20px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--text-faint)' }}>TOTAL ESPERADO</span>
          <span style={{ fontSize: 13, color: 'var(--gold-dim)' }}>
            titulo +{fmt(best.titleGain)}
          </span>
        </div>
        <div className="numeral" style={{ fontSize: 96, fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 0.92, marginTop: 4 }}>
          {fmt(best.total.mean)}
        </div>
        <DistributionBar
          dist={best.total}
          min={best.total.p10 - best.total.sd}
          max={best.total.p90 + best.total.sd}
          style={{ marginTop: 12 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 13, color: 'var(--text-dim)' }}>
          <span>p10 {fmt(best.total.p10)}</span>
          <span>p90 {fmt(best.total.p90)}</span>
        </div>
      </div>

      {/* ---------- rodape de honestidade ---------- */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          letterSpacing: '0.06em',
          color: 'var(--text-faint)',
        }}
      >
        <span>
          {candidateCount.toLocaleString('pt-BR')} escalacoes avaliadas × 64 titulos em {elapsedMs.toFixed(0)} ms
          &nbsp;·&nbsp; dados de 03/08/2026 (battlepass 2.888 replays + Reddit 1.601 partidas)
        </span>
        <span>
          niveis do battlepass.ru, deltas de time do Reddit, encolhimento empirico-Bayes
        </span>
      </div>
    </>
  );
}
