import { useEffect, useState } from 'react';
import { useEngine } from '../../state/useEngine';
import { GoldRule } from '../../ui/primitives';
import { PlayerPortrait, TeamLogo } from '../../ui/Portrait';
import { ROLE_POSITIONS } from '../../domain/roles';
import type { RoleSlot } from '../../domain/roles';
import { PREFIX_DEFINITIONS, SUFFIX_DEFINITIONS } from '../../domain/titles';
import { useLang } from '../../i18n/LangContext';
import { label } from '../../i18n/strings';
import type { RoleRanking } from '../../engine/teamRanking';
import type { LoadedData } from '../../data/load';

const LOCK_AT = Date.parse('2026-08-13T02:00:00Z');

/**
 * Ritmo vertical do palco de 1080px, somado a mao em vez de chutado.
 *
 * O card mais alto e o do MEIO: retrato solo maior (176) e TRES cores de emblema
 * contra duas das outras funcoes.
 *   20 padding + 28 rotulo + 26 regua + 60 logo/nome + 223 retrato
 *   + 43 rotulo do estandarte + 154 tres caixas + 25 rodape + 20 padding = 599
 * 610 deixa folga. A versao anterior fixava 540 e o conteudo vazava pra fora.
 */
const CARD_Y = 96;
const CARD_H = 610;
const BAND_Y = CARD_Y + CARD_H + 16;
const BAND_H = 168;
const RULES_Y = BAND_Y + BAND_H + 14;
const RULES_H = 100;

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
  return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

/**
 * Uma vaga da escalacao.
 *
 * A tela e uma COLA, nao um relatorio. Quem assiste quer copiar tres nomes de
 * time e um titulo — nao a minha margem de confianca. Tudo que era epistemologia
 * minha (barra de "errar aqui custa", selo de procedencia, p10/p90) saiu.
 */
function RoleCard({
  slot, ranking, data, x, y, w,
}: {
  readonly slot: RoleSlot;
  readonly ranking: RoleRanking;
  readonly data: LoadedData;
  readonly x: number; readonly y: number; readonly w: number;
}) {
  const { lang, t } = useLang();
  const leader = ranking.teams[0];
  const team = data.teams.get(leader.teamId);
  const unit = data.roleUnits.get(`${leader.teamId}:${slot}`);
  const roster = (unit?.playerIds ?? []).map((id) => ({ id, nick: data.players.get(id)?.nick ?? id }));
  const portraitSize = roster.length > 1 ? 138 : 176;

  return (
    <div
      className="panel"
      style={{
        position: 'absolute', left: x, top: y, width: w, height: CARD_H,
        padding: '20px 24px', display: 'flex', flexDirection: 'column',
        // Corta o que vazar em vez de deixar escapar por cima do painel de baixo.
        // Com o ritmo vertical abaixo nada deveria vazar; isto e a rede.
        overflow: 'hidden',
        background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="display" style={{ fontSize: 25, fontWeight: 700, color: 'var(--gold-bright)' }}>
          {label.role(slot, lang)}
        </span>
        <span style={{ fontSize: 14, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
          {t.pos} {ROLE_POSITIONS[slot].join(' + ')}
        </span>
      </div>

      <GoldRule style={{ margin: '11px 0 14px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 60 }}>
        <TeamLogo teamId={leader.teamId} size={58} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 1.0 }}>
          {team?.name}
        </div>
      </div>

      {/* as caras — e assim que a pessoa reconhece o time no cliente */}
      <div style={{ marginTop: 16, display: 'flex', gap: 16, justifyContent: 'center' }}>
        {roster.map((p) => (
          <PlayerPortrait key={p.id} playerId={p.id} nick={p.nick} size={portraitSize} />
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, letterSpacing: '0.12em', color: 'var(--gold)', marginBottom: 10 }}>
          {t.keepOnBanner}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {leader.rerollTargets.map((color) => {
            // No maximo tres: a quarta opcao ja e marginal e era o que fazia a
            // caixa quebrar em duas linhas e estourar o card.
            const keep = color.targets.filter((t) => t.verdict !== 'rerolar').slice(0, 3);
            return (
              <div
                className="emblem"
                key={color.color}
                data-color={color.color}
                style={{ padding: '9px 13px', gap: 11, alignItems: 'center', minHeight: 46 }}
              >
                <div style={{ width: 76, flexShrink: 0, fontSize: 12, letterSpacing: '0.04em', color: 'var(--text-dim)' }}>
                  {label.color(color.color, lang).toUpperCase()}
                  {color.emblemCount > 1 && <span style={{ color: 'var(--gold)' }}> ×{color.emblemCount}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: 17, color: 'var(--text)', fontWeight: 600, lineHeight: 1.3 }}>
                  {keep.map((k) => label.stat(k.statId, lang)).join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: 12, color: 'var(--text-faint)' }}>
        {t.rerollAnythingElse}
      </div>
    </div>
  );
}

export function DreamScene() {
  const { data, teamRanking, recommendedTitle } = useEngine();
  const countdown = useCountdown();
  const { lang, t } = useLang();

  const prefix = recommendedTitle.prefix ? PREFIX_DEFINITIONS[recommendedTitle.prefix] : null;
  const suffix = recommendedTitle.suffix ? SUFFIX_DEFINITIONS[recommendedTitle.suffix] : null;

  const payoffOrder = (['core', 'mid', 'support'] as RoleSlot[])
    .sort((a, b) => teamRanking[b].rerollPayoff - teamRanking[a].rerollPayoff);
  const bestReroll = payoffOrder[0];

  /**
   * A cor mais DESIGUAL da funcao onde a ficha rende mais.
   *
   * E o motivo por tras do "gaste no Meio": nao e que o Meio valha mais pontos,
   * e que la a distancia entre a melhor e a segunda melhor stat de uma cor e
   * enorme — entao o resultado do sorteio decide muito, e ficha compra muito.
   * Onde as opcoes sao parecidas, a sorte quase nao pesa e a ficha compra pouco.
   */
  const sharpest = teamRanking[bestReroll].teams[0].rerollTargets
    .map((color) => ({
      color: color.color,
      topStat: color.targets[0].statId,
      timesSecond: color.targets[1] && color.targets[1].value > 0
        ? color.targets[0].value / color.targets[1].value
        : 1,
    }))
    .sort((a, b) => b.timesSecond - a.timesSecond)[0];

  return (
    <>
      <div style={{ position: 'absolute', top: 32, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="display" style={{ fontSize: 24, letterSpacing: '0.2em', color: 'var(--gold-bright)' }}>
          DOTA DOS SONHOS
        </span>
        <span style={{ fontSize: 16, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>
          FECHA EM <span className="numeral" style={{ color: 'var(--warn)', fontSize: 26, letterSpacing: 0 }}>{countdown}</span>
        </span>
      </div>

      {/* PRINCIPAL, MEIO, SUPORTE — na ordem do cliente, pra bater com o que a pessoa ve la */}
      <RoleCard slot="core" ranking={teamRanking.core} data={data} x={60} y={CARD_Y} w={588} />
      <RoleCard slot="mid" ranking={teamRanking.mid} data={data} x={666} y={CARD_Y} w={588} />
      <RoleCard slot="support" ranking={teamRanking.support} data={data} x={1272} y={CARD_Y} w={588} />

      {/* TREINADOR */}
      <div
        className="panel"
        style={{
          position: 'absolute', left: 60, top: BAND_Y, width: 1194, height: BAND_H, padding: '20px 28px',
          background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
        }}
      >
        <div style={{ fontSize: 14, letterSpacing: '0.14em', color: 'var(--gold)' }}>{t.coachTitle}</div>
        <div className="display" style={{ fontSize: 60, color: 'var(--gold-bright)', marginTop: 10, lineHeight: 1 }}>
          {recommendedTitle.prefix ? label.prefix(recommendedTitle.prefix, lang) : '—'}
          <span style={{ color: 'var(--gold-dim)' }}> · </span>
          {recommendedTitle.suffix ? label.suffix(recommendedTitle.suffix, lang) : '—'}
        </div>
        <div style={{ display: 'flex', gap: 44, marginTop: 16, fontSize: 19, color: 'var(--text)' }}>
          {prefix && recommendedTitle.prefix && (
            <span>
              <b style={{ color: 'var(--gold-bright)' }}>+{Math.round(prefix.bonus * 100)}%</b>{' '}
              {t.when} {label.prefixCondition(recommendedTitle.prefix, lang)}
            </span>
          )}
          {suffix && recommendedTitle.suffix && (
            <span>
              <b style={{ color: 'var(--gold-bright)' }}>+{Math.round(suffix.bonus * 100)}%</b>{' '}
              {t.when} {label.suffixCondition(recommendedTitle.suffix, lang)}
            </span>
          )}
        </div>
      </div>

      {/* FICHAS */}
      <div
        className="panel"
        style={{
          position: 'absolute', left: 1272, top: BAND_Y, width: 588, height: BAND_H, padding: '20px 26px',
          background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
        }}
      >
        <div style={{ fontSize: 14, letterSpacing: '0.14em', color: 'var(--gold)' }}>{t.tokensTitle}</div>
        <div className="display" style={{ fontSize: 42, color: 'var(--gold-bright)', marginTop: 8, lineHeight: 1 }}>
          {t.spendOn} {label.role(bestReroll, lang)}
        </div>
        <div style={{ marginTop: 10, fontSize: 17, color: 'var(--gold)', fontWeight: 600 }}>
          {t.tokensYield((teamRanking[bestReroll].rerollPayoff * 100).toFixed(0))}
        </div>
        {/*
          O MOTIVO. Sem ele o card dizia "gaste no Meio" e ninguem — nem o Kamus —
          entendia por que. Ficha rende onde a SORTE PESA, e no azul do Meio ela
          pesa mais do que em qualquer outro lugar do torneio.
        */}
        {sharpest && (
          <div style={{ marginTop: 10, fontSize: 15, color: 'var(--text)', lineHeight: 1.4 }}>
            {t.tokensWhy(
              label.color(sharpest.color, lang).toLowerCase(),
              label.stat(sharpest.topStat, lang),
              sharpest.timesSecond.toFixed(1),
            )}
          </div>
        )}
      </div>

      {/* AS DUAS REGRAS QUE MAIS SALVAM FICHA */}
      <div
        className="panel"
        style={{
          position: 'absolute', left: 60, top: RULES_Y, width: 1800, height: RULES_H, padding: '16px 28px',
          display: 'flex', gap: 30, alignItems: 'center',
          background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
        }}
      >
        <div style={{ flex: 1, fontSize: 21, color: 'var(--text)', lineHeight: 1.45 }}>
          {t.greenRule(
            label.color('green', lang).toUpperCase(),
            label.color('red', lang).toLowerCase(),
            label.color('blue', lang).toLowerCase(),
          )}
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--gold-line)' }} />
        <div style={{ flex: 1, fontSize: 21, color: 'var(--text)', lineHeight: 1.45 }}>
          <b style={{ color: 'var(--warn)' }}>{t.fractalWarnLead}</b> {t.fractalWarnBody}
        </div>
      </div>
    </>
  );
}
