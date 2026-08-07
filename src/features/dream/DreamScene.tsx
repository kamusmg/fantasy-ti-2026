import { useEffect, useState } from 'react';
import { useEngine } from '../../state/useEngine';
import { GoldRule, ProvenanceChip, fmt } from '../../ui/primitives';
import { ROLE_LABEL_PT_BR, ROLE_POSITIONS } from '../../domain/roles';
import type { RoleSlot } from '../../domain/roles';
import { COLOR_LABEL_PT_BR } from '../../domain/stats';
import { PREFIX_DEFINITIONS, SUFFIX_DEFINITIONS } from '../../domain/titles';
import { isTechnicalTie } from '../../engine/teamRanking';
import type { RoleRanking } from '../../engine/teamRanking';
import type { LoadedData } from '../../data/load';

const LOCK_AT = Date.parse('2026-08-13T02:00:00Z');

function useCountdown(): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const left = Math.max(0, LOCK_AT - now);
  const d = Math.floor(left / 86_400_000);
  const h = Math.floor((left % 86_400_000) / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Painel de uma funcao.
 *
 * O tamanho e proporcional a ALAVANCA daquela funcao — errar o Suporte custa 35%,
 * errar o Principal custa 7%. Dar o mesmo espaco pras tres seria desinformar: a
 * assimetria E o achado.
 */
function RolePanel({
  slot, ranking, data, x, y, w, h, scale,
}: {
  readonly slot: RoleSlot;
  readonly ranking: RoleRanking;
  readonly data: LoadedData;
  readonly x: number; readonly y: number; readonly w: number; readonly h: number;
  readonly scale: 'grande' | 'normal';
}) {
  const leader = ranking.teams[0];
  const runnerUp = ranking.teams[1];
  const team = data.teams.get(leader.teamId);
  const unit = data.roleUnits.get(`${leader.teamId}:${slot}`);
  const nicks = (unit?.playerIds ?? []).map((id) => data.players.get(id)?.nick ?? id);
  const tie = isTechnicalTie(ranking.leaderMargin);

  const big = scale === 'grande';
  const nameSize = big ? 76 : 46;
  const costPct = ranking.spread * 100;
  const barWidth = Math.min(100, costPct * 2.6);

  return (
    <div className="panel" style={{ position: 'absolute', left: x, top: y, width: w, height: h, padding: big ? '24px 30px' : '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="display" style={{ fontSize: big ? 24 : 19, fontWeight: 700 }}>{ROLE_LABEL_PT_BR[slot]}</span>
        <span style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>
          POS {ROLE_POSITIONS[slot].join(' + ')}
        </span>
      </div>
      <GoldRule style={{ margin: big ? '14px 0 20px' : '10px 0 14px' }} />

      <div style={{ fontFamily: 'var(--font-display)', fontSize: nameSize, fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 0.98 }}>
        {team?.name}
      </div>
      <div style={{ marginTop: big ? 12 : 8, fontSize: big ? 22 : 16, color: 'var(--text-dim)' }}>
        {nicks.join('  ·  ')}
      </div>

      {/* alavanca — responde "eu preciso me importar com isso?" antes de "qual e a resposta?" */}
      <div style={{ marginTop: big ? 26 : 18 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--text-faint)' }}>
          ERRAR AQUI CUSTA ATE
          <span className="numeral" style={{ fontSize: big ? 30 : 24, color: 'var(--warn)', marginLeft: 10, letterSpacing: 0 }}>
            −{costPct.toFixed(0)}%
          </span>
        </div>
        <div style={{ marginTop: 8, height: big ? 12 : 9, background: 'rgba(0,0,0,0.45)', border: '1px solid var(--gold-line)', borderRadius: 2 }}>
          <div style={{ width: `${barWidth}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold-dim), var(--warn))' }} />
        </div>
        <div style={{ marginTop: 9, fontSize: big ? 16 : 13, color: tie ? 'var(--warn)' : 'var(--text-dim)' }}>
          {tie
            ? `empate tecnico com ${data.teams.get(runnerUp.teamId)?.name} (${(ranking.leaderMargin * 100).toFixed(1)}%)`
            : `${(ranking.leaderMargin * 100).toFixed(0)}% a frente de ${data.teams.get(runnerUp.teamId)?.name}`}
        </div>
        {leader.robust && (
          <div style={{ marginTop: 5, fontSize: big ? 15 : 12, color: 'var(--ok)' }}>
            vale para QUALQUER estandarte que voce tirar
          </div>
        )}
      </div>

      {/* o que PAGA — nao e escolha, e alvo de reroll */}
      <div style={{ position: 'absolute', left: big ? 30 : 24, right: big ? 30 : 24, bottom: big ? 24 : 20 }}>
        <GoldRule style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--text-faint)', marginBottom: 10 }}>
          O QUE PAGA NESTE TIME &nbsp;—&nbsp; voce nao escolhe, voce rerola ate chegar
        </div>
        {leader.rerollTargets.map((color) => (
          <div key={color.color} style={{ marginBottom: 8 }}>
            <div className="emblem" data-color={color.color} style={{ padding: big ? '8px 12px' : '6px 10px', gap: 10 }}>
              <div style={{ width: big ? 74 : 60, fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
                {COLOR_LABEL_PT_BR[color.color].toUpperCase()}
                {color.emblemCount > 1 && <span style={{ color: 'var(--gold-dim)' }}> ×{color.emblemCount}</span>}
              </div>
              <div style={{ flex: 1, display: 'flex', gap: big ? 14 : 9, alignItems: 'baseline', flexWrap: 'nowrap', overflow: 'hidden' }}>
                {color.targets.slice(0, big ? 4 : 3).map((t) => (
                  <span
                    key={t.statId}
                    style={{
                      fontSize: big ? 17 : 13,
                      whiteSpace: 'nowrap',
                      color: t.verdict === 'guardar' ? 'var(--text)' : t.verdict === 'aceitavel' ? 'var(--text-dim)' : 'var(--text-faint)',
                      textDecoration: t.verdict === 'rerolar' ? 'line-through' : 'none',
                      fontWeight: t.verdict === 'guardar' ? 600 : 400,
                    }}
                  >
                    {t.labelPtBr}
                    <span className="numeral" style={{ color: 'var(--gold-dim)', marginLeft: 5, fontSize: big ? 15 : 12 }}>
                      {(t.shareOfBest * 100).toFixed(0)}%
                    </span>
                  </span>
                ))}
              </div>
              {big && <ProvenanceChip estimate={color.targets[0].estimate} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DreamScene() {
  const { data, ranked, teamRanking, elapsedMs, candidateCount } = useEngine();
  const countdown = useCountdown();
  const best = ranked[0];

  const prefix = best.title.prefix ? PREFIX_DEFINITIONS[best.title.prefix] : null;
  const suffix = best.title.suffix ? SUFFIX_DEFINITIONS[best.title.suffix] : null;

  // A funcao de maior alavanca ganha o painel grande. Hoje e o Suporte (35%).
  const ordered = (['core', 'mid', 'support'] as RoleSlot[])
    .sort((a, b) => teamRanking[b].spread - teamRanking[a].spread);
  const [lead, ...rest] = ordered;

  const payoffOrder = (['core', 'mid', 'support'] as RoleSlot[])
    .sort((a, b) => teamRanking[b].rerollPayoff - teamRanking[a].rerollPayoff);

  return (
    <>
      <div style={{ position: 'absolute', top: 32, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="display" style={{ fontSize: 20, letterSpacing: '0.32em', color: 'var(--gold-dim)' }}>
          FANTASY TI 2026 &nbsp;·&nbsp; FASE DE GRUPOS
        </span>
        <span style={{ fontSize: 13, letterSpacing: '0.18em', color: 'var(--text-faint)' }}>
          FECHA EM <span className="numeral" style={{ color: 'var(--warn)', fontSize: 22, letterSpacing: 0 }}>{countdown}</span>
        </span>
      </div>

      {/* funcao de maior alavanca, em dobro */}
      <RolePanel slot={lead} ranking={teamRanking[lead]} data={data} x={60} y={86} w={880} h={614} scale="grande" />
      <RolePanel slot={rest[0]} ranking={teamRanking[rest[0]]} data={data} x={968} y={86} w={444} h={614} scale="normal" />
      <RolePanel slot={rest[1]} ranking={teamRanking[rest[1]]} data={data} x={1436} y={86} w={424} h={614} scale="normal" />

      {/* treinador */}
      <div className="panel" style={{ position: 'absolute', left: 60, top: 726, width: 880, height: 272, padding: '22px 30px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--text-faint)' }}>TITULO DE TREINADOR</div>
        <div className="display" style={{ fontSize: 52, color: 'var(--gold-bright)', marginTop: 10, lineHeight: 1 }}>
          {prefix?.labelPtBr ?? '—'} <span style={{ color: 'var(--gold-dim)' }}>·</span> {suffix?.labelPtBr ?? '—'}
        </div>
        <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
          {prefix && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, color: 'var(--text-dim)' }}>
                <b style={{ color: 'var(--gold)' }}>+{Math.round(prefix.bonus * 100)}%</b> quando {prefix.conditionPtBr}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 5 }}>
                calculado sobre os 5 jogadores DESTA escalacao
              </div>
            </div>
          )}
          {suffix && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, color: 'var(--text-dim)' }}>
                <b style={{ color: 'var(--gold)' }}>+{Math.round(suffix.bonus * 100)}%</b> quando {suffix.conditionPtBr}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 5 }}>
                dispara em {Math.round(suffix.perMapProbability * 100)}% dos mapas que contam
              </div>
            </div>
          )}
        </div>
        <div style={{ marginTop: 18, fontSize: 14, color: 'var(--ok)' }}>
          trocar time e trocar titulo e de GRACA e ilimitado ate fechar — nao custa ficha
        </div>
      </div>

      {/* fichas */}
      <div className="panel" style={{ position: 'absolute', left: 968, top: 726, width: 892, height: 272, padding: '22px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--text-faint)' }}>AS 40 FICHAS DE REROLL</span>
          <span style={{ fontSize: 13, color: 'var(--gold-dim)' }}>nota do modelo {fmt(best.total.mean)}</span>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
          {payoffOrder.map((slot, i) => (
            <div key={slot} style={{ flex: 1, background: 'var(--bg-slot)', border: '1px solid var(--gold-line)', borderRadius: 2, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.1em', color: 'var(--text-faint)' }}>{ROLE_LABEL_PT_BR[slot].toUpperCase()}</div>
              <div className="numeral" style={{ fontSize: 40, color: i === 0 ? 'var(--gold-bright)' : 'var(--text-dim)', lineHeight: 1, marginTop: 4 }}>
                +{(teamRanking[slot].rerollPayoff * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                {i === 0 ? 'gaste aqui' : 'depois'}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          So existe conserto cirurgico de <b style={{ color: 'var(--text)' }}>STAT</b> em emblema{' '}
          <b style={{ color: 'var(--emblem-green)' }}>VERDE</b>. No vermelho so da pra mirar QUALIDADE, no azul so TRACO —
          nos dois, subir qualidade de uma stat ruim e polir lixo.
        </div>
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--warn)' }}>
          ⚠ Com FRACTAL no estandarte, SUBIR uma qualidade pode PIORAR a nota — ele so paga se as tres qualidades forem diferentes.
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 12, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-faint)' }}>
        <span>
          {candidateCount.toLocaleString('pt-BR')} escalacoes × 64 titulos em {elapsedMs.toFixed(0)} ms
          &nbsp;·&nbsp; recomendacao no p75 dos estandartes possiveis, nao na media nem no melhor caso
        </span>
        <span>battlepass 2.888 replays + Reddit 1.601 partidas &nbsp;·&nbsp; dados de 03/08</span>
      </div>
    </>
  );
}
