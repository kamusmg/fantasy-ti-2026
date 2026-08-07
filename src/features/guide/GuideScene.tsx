import { useState } from 'react';
import { useEngine } from '../../state/useEngine';
import { GoldRule } from '../../ui/primitives';
import { BANNER_LAYOUT, ROLE_POSITIONS } from '../../domain/roles';
import type { RoleSlot } from '../../domain/roles';
import type { EmblemColor } from '../../domain/stats';
import type { ColorTargets, RerollTarget } from '../../engine/rerollTargets';
import { useLang } from '../../i18n/LangContext';
import { label } from '../../i18n/strings';

/**
 * Ritmo vertical do palco de 1080px, somado a mao.
 *
 *   18   abas de cena + idioma (nivel do App)
 *   64   titulo da cena
 *  108   os cards
 *
 * Card, de cima pra baixo:
 *   20 padding + 30 cabecalho + 17 time + 26 regua + 56 ordem do estandarte
 *   + 579 tres blocos de cor (185 cada + 12 de gap) + 20 padding = 748
 *
 * Cada bloco lista as SEIS stats da cor — 18 linhas no card. Com linha de 22px e
 * gap de 4 dava 786 e o Meio cortava a ultima stat: 22 e 4 sao o que a soma
 * aguenta em DUAS cores, nao em tres.
 *
 * As tres cores aparecem SEMPRE, mesmo a que a funcao nao tem — assim os tres
 * cards tem a mesma estrutura, e a ausencia vira informacao em vez de buraco.
 */
const CARD_Y = 108;
const CARD_H = 796;
const FOOT_Y = CARD_Y + CARD_H + 14;
const FOOT_H = 110;

const VERDICT_COLOR = {
  guardar: '#8fd46e',
  aceitavel: 'var(--gold)',
  rerolar: '#f0705e',
} as const;

const EMBLEM_VAR: Readonly<Record<EmblemColor, string>> = {
  red: 'var(--emblem-red)',
  blue: 'var(--emblem-blue)',
  green: 'var(--emblem-green)',
};

/**
 * Uma stat da cor, com o quanto ela vale em relacao a melhor da MESMA cor.
 *
 * A barra e o numero sao a mesma informacao — a barra pra quem esta assistindo e
 * so bate o olho, o numero pra quem esta decidindo se gasta ficha.
 */
function StatRow({ target }: { readonly target: RerollTarget }) {
  const { lang } = useLang();
  const pct = Math.round(target.shareOfBest * 100);
  const color = VERDICT_COLOR[target.verdict];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 20 }}>
      <span
        style={{
          flex: 1, minWidth: 0, fontSize: 15, color: 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontWeight: target.verdict === 'guardar' ? 600 : 400,
        }}
      >
        {label.stat(target.statId, lang)}
      </span>

      <span style={{ width: 96, flexShrink: 0, height: 7, background: 'rgba(0,0,0,0.45)', borderRadius: 4, overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: color, opacity: 0.85 }} />
      </span>

      <span className="numeral" style={{ width: 42, flexShrink: 0, textAlign: 'right', fontSize: 17, color, fontWeight: 600 }}>
        {pct}%
      </span>
    </div>
  );
}

/**
 * Um bloco de cor. Reaproveita `.emblem`, que ja pinta a borda esquerda pela cor.
 *
 * `targets` ausente = a funcao nao tem emblema dessa cor. O bloco continua
 * aparecendo, apagado: e a resposta pra "e o azul do Principal?", que a tela
 * anterior deixava o espectador adivinhar.
 */
function ColorBlock({ color, targets }: { readonly color: EmblemColor; readonly targets?: ColorTargets }) {
  const { lang, t } = useLang();

  return (
    <div
      className="emblem"
      data-color={color}
      style={{ display: 'block', padding: '12px 14px', flexShrink: 0, opacity: targets ? 1 : 0.55 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 13, letterSpacing: '0.12em', fontWeight: 600, color: EMBLEM_VAR[color] }}>
          {label.color(color, lang).toUpperCase()}
        </span>
        <span style={{ fontSize: 13, letterSpacing: '0.06em', color: targets ? 'var(--gold)' : 'var(--text-faint)' }}>
          {targets ? `×${targets.emblemCount}` : '×0'}
        </span>
      </div>

      {targets
        ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {targets.targets.map((tg) => <StatRow key={tg.statId} target={tg} />)}
          </div>
        )
        : (
          <div style={{ fontSize: 14, lineHeight: 1.4, fontStyle: 'italic', color: 'var(--text-faint)' }}>
            {t.guideColorAbsent}
          </div>
        )}
    </div>
  );
}

/**
 * A ordem real das cores no estandarte daquela funcao.
 *
 * Vem do `BANNER_LAYOUT`, nao de texto: a tabela original abreviava isso como
 * "Prioridade R/G/R", que so faz sentido pra quem ja sabe. Aqui a pessoa ve as
 * caixas na mesma ordem em que elas aparecem no cliente — e uma cor que nao
 * aparece na fileira simplesmente nao tem bloco embaixo.
 */
function BannerOrder({ slot }: { readonly slot: RoleSlot }) {
  const { t } = useLang();

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--text-faint)', marginBottom: 6 }}>
        {t.bannerOrder}
      </div>
      <div style={{ display: 'flex', gap: 8, height: 26 }}>
        {BANNER_LAYOUT[slot].groupStage.map((color, i) => (
          <div
            key={i}
            style={{
              width: 62, height: 26, borderRadius: 2,
              background: EMBLEM_VAR[color],
              border: '1px solid rgba(0,0,0,0.35)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function RoleGuideCard({
  slot, x, teamId, onPickTeam,
}: {
  readonly slot: RoleSlot;
  readonly x: number;
  /** Equipe escolhida. null = a que o modelo recomenda. */
  readonly teamId: string | null;
  readonly onPickTeam: (teamId: string | null) => void;
}) {
  const { data, teamRanking } = useEngine();
  const { lang, t } = useLang();

  const ranked = teamRanking[slot].teams;
  const leader = (teamId ? ranked.find((tm) => tm.teamId === teamId) : undefined) ?? ranked[0];

  return (
    <div
      className="panel"
      style={{
        position: 'absolute', left: x, top: CARD_Y, width: 588, height: CARD_H,
        padding: '20px 24px', display: 'flex', flexDirection: 'column',
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

      {/*
        De QUEM sao esses numeros — e trocavel.
        O valor de um atributo depende da equipe: Runas no Meio do Falcons nao
        vale o mesmo que no de outra. Sem poder trocar, a tela so servia pra quem
        fosse seguir a recomendacao. As opcoes vem na ordem do ranking, e a
        primeira (★) e a que o modelo recomenda.
      */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <span style={{ fontSize: 12, letterSpacing: '0.12em', color: 'var(--text-faint)' }}>
          {t.guideMeasuredOn.toUpperCase()}
        </span>
        <select
          value={leader.teamId}
          onChange={(e) => onPickTeam(e.target.value === ranked[0].teamId ? null : e.target.value)}
          style={{
            font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            padding: '3px 8px', borderRadius: 3,
            border: '1px solid var(--gold-line)',
            background: 'rgba(0,0,0,0.35)', color: 'var(--gold-bright)',
          }}
        >
          {ranked.map((tm, i) => (
            <option key={tm.teamId} value={tm.teamId} style={{ background: 'var(--bg-panel)', color: 'var(--text)' }}>
              {i === 0 ? '★ ' : `${i + 1}. `}{data.teams.get(tm.teamId)?.name ?? tm.teamId}
            </option>
          ))}
        </select>
      </div>

      {/*
        Equipe E jogadores, porque o cliente usa os dois nomes em telas
        diferentes: na de escolher vem o nome da EQUIPE ("TEAM VISION"), e na
        escalacao montada vem o nome dos JOGADORES ("Satanic e Noticed"). Quem
        confere as duas telas lado a lado precisa dos dois pra fechar.
      */}
      <div style={{ fontSize: 15, color: 'var(--text-dim)', marginTop: 6, minHeight: 20, letterSpacing: '0.02em' }}>
        {(data.roleUnits.get(`${leader.teamId}:${slot}`)?.playerIds ?? [])
          .map((id) => data.players.get(id)?.nick ?? id)
          .join(' e ')}
      </div>


      <GoldRule style={{ margin: '11px 0 14px' }} />

      <BannerOrder slot={slot} />

      {/*
        `flex: 1` + `minHeight: 0` + `overflow: hidden`: a folga do card mora
        aqui, repartida entre os blocos. O Principal tem so DUAS cores (o
        estandarte dele nao tem azul), entao a folga dele e maior.
      */}
      <div
        style={{
          flex: 1, minHeight: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'space-between',
        }}
      >
        {(['red', 'blue', 'green'] as const).map((color) => (
          <ColorBlock key={color} color={color} targets={leader.rerollTargets.find((c) => c.color === color)} />
        ))}
      </div>
    </div>
  );
}

export function GuideScene() {
  const { t } = useLang();
  /** null = a equipe que o modelo recomenda pra aquela funcao. */
  const [picked, setPicked] = useState<Record<RoleSlot, string | null>>({ core: null, mid: null, support: null });
  const pick = (slot: RoleSlot) => (teamId: string | null) => setPicked((p) => ({ ...p, [slot]: teamId }));

  return (
    <>
      {/* Linha 2: as abas de cena vivem em y=18, no nivel do App. */}
      <div style={{ position: 'absolute', top: 64, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="display" style={{ fontSize: 19, letterSpacing: '0.18em', color: 'var(--gold-bright)' }}>
          {t.guideTitle}
        </span>
        <span style={{ fontSize: 14, letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
          {t.guideSubtitle}
        </span>
      </div>

      <RoleGuideCard slot="core" x={60} teamId={picked.core} onPickTeam={pick('core')} />
      <RoleGuideCard slot="mid" x={666} teamId={picked.mid} onPickTeam={pick('mid')} />
      <RoleGuideCard slot="support" x={1272} teamId={picked.support} onPickTeam={pick('support')} />

      <div
        className="panel"
        style={{
          position: 'absolute', left: 60, top: FOOT_Y, width: 1800, height: FOOT_H,
          padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 24,
          background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
        }}
      >
        <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
          {(['guardar', 'aceitavel', 'rerolar'] as const).map((v) => (
            <span
              key={v}
              style={{
                fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: VERDICT_COLOR[v],
                border: `1px solid ${VERDICT_COLOR[v]}`, borderRadius: 2, padding: '5px 12px',
              }}
            >
              {t.verdictLabel[v]}
            </span>
          ))}
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--gold-line)' }} />
        <div style={{ flex: 1, fontSize: 19, color: 'var(--text)', lineHeight: 1.45 }}>
          <b style={{ color: 'var(--warn)' }}>{t.guideFooterLead}</b> {t.guideFooterBody}
        </div>
      </div>
    </>
  );
}
