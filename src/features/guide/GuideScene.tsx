import { GoldRule } from '../../ui/primitives';
import { BANNER_LAYOUT, ROLE_POSITIONS } from '../../domain/roles';
import type { RoleSlot } from '../../domain/roles';
import type { EmblemColor } from '../../domain/stats';
import { useLang } from '../../i18n/LangContext';
import { label } from '../../i18n/strings';
import { ROLE_GUIDES } from './guideData';
import type { ColorGuide, GuideItem, TierList } from './guideData';

/**
 * Ritmo vertical do palco de 1080px, somado a mao.
 *
 *   18   abas de cena + idioma (nivel do App)
 *   64   titulo da cena
 *  108   os cards
 *
 * Card, de cima pra baixo:
 *   20 padding + 30 cabecalho + 26 regua + 60 ordem do estandarte
 *   + 414 tres blocos de cor + 14 folga + 146 ranking geral + 20 padding = 710
 *
 * Sobram ~44px de folga dentro do CARD_H. Ela mora no container das cores, que e
 * `flex: 1` com `overflow: hidden`: se alguma lista de stats quebrar em duas
 * linhas, o excedente come a folga em vez de empurrar o ranking geral pra fora
 * do card. O ranking geral e `flexShrink: 0` — ele nunca cede.
 */
const CARD_Y = 108;
const CARD_H = 754;
const FOOT_Y = CARD_Y + CARD_H + 14;
const FOOT_H = 120;

const TIER_COLOR = { top: '#8fd46e', mid: 'var(--gold)', bad: '#f0705e' } as const;

const EMBLEM_VAR: Readonly<Record<EmblemColor, string>> = {
  red: 'var(--emblem-red)',
  blue: 'var(--emblem-blue)',
  green: 'var(--emblem-green)',
};

function TierRow({ tier, items }: { readonly tier: keyof typeof TIER_COLOR; readonly items: readonly GuideItem[] }) {
  const { lang, t } = useLang();
  const name = tier === 'top' ? t.tierTop : tier === 'mid' ? t.tierMid : t.tierBad;
  const text = items
    .map((item) => (typeof item === 'string' ? label.stat(item, lang) : lang === 'pt' ? item.raw : item.rawEn))
    .join(', ');

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
      <span
        style={{
          width: 48, flexShrink: 0, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.1em', color: TIER_COLOR[tier],
        }}
      >
        {name}
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 16, lineHeight: 1.35, color: text ? 'var(--text)' : 'var(--text-faint)' }}>
        {text || '—'}
      </span>
    </div>
  );
}

function Tiers({ tiers }: { readonly tiers: TierList }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <TierRow tier="top" items={tiers.top} />
      <TierRow tier="mid" items={tiers.mid} />
      <TierRow tier="bad" items={tiers.bad} />
    </div>
  );
}

/** Um bloco de cor. Reaproveita `.emblem`, que ja pinta a borda esquerda pela cor. */
function ColorBlock({ guide }: { readonly guide: ColorGuide }) {
  const { lang, t } = useLang();

  return (
    <div
      className="emblem"
      data-color={guide.color}
      style={{ display: 'block', padding: '12px 14px', flexShrink: 0 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 13, letterSpacing: '0.12em', fontWeight: 600, color: EMBLEM_VAR[guide.color] }}>
          {label.color(guide.color, lang).toUpperCase()}
        </span>
        <span style={{ fontSize: 13, letterSpacing: '0.06em', color: guide.emblems > 0 ? 'var(--gold)' : 'var(--text-faint)' }}>
          {guide.emblems > 0 ? `×${guide.emblems}` : '—'}
        </span>
      </div>

      {guide.tiers
        ? <Tiers tiers={guide.tiers} />
        : (
          <div style={{ fontSize: 15, lineHeight: 1.4, fontStyle: 'italic', color: 'var(--text-faint)' }}>
            {guide.noteKey ? t[guide.noteKey] : null}
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
 * tres caixas na mesma ordem em que elas aparecem no cliente.
 */
function BannerOrder({ slot }: { readonly slot: RoleSlot }) {
  const { t } = useLang();
  const colors = BANNER_LAYOUT[slot].groupStage;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--text-faint)', marginBottom: 6 }}>
        {t.bannerOrder}
      </div>
      <div style={{ display: 'flex', gap: 8, height: 26 }}>
        {colors.map((color, i) => (
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

function RoleGuideCard({ slot, x }: { readonly slot: RoleSlot; readonly x: number }) {
  const { lang, t } = useLang();
  const guide = ROLE_GUIDES.find((g) => g.slot === slot);
  if (!guide) return null;

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

      <GoldRule style={{ margin: '11px 0 14px' }} />

      <BannerOrder slot={slot} />

      {/*
        `flex: 1` + `minHeight: 0` + `overflow: hidden`: a folga do card mora
        aqui. Se uma lista quebrar em duas linhas ela come a folga; o ranking
        geral la embaixo nao se mexe.
      */}
      <div
        style={{
          flex: 1, minHeight: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', gap: 12,
          // A sobra se reparte ENTRE os blocos. Empilhados no topo, ela virava
          // um buraco unico logo acima do ranking geral — e de tamanho diferente
          // em cada card, porque o Principal tem um bloco mais curto (o azul).
          justifyContent: 'space-between',
        }}
      >
        {guide.colors.map((c) => <ColorBlock key={c.color} guide={c} />)}
      </div>

      {/* RANKING GERAL — preso no rodape do card, alinhado nas tres funcoes */}
      <div style={{ flexShrink: 0, paddingTop: 14 }}>
        <div
          style={{
            padding: '14px 16px', borderRadius: 2,
            border: '1px solid var(--gold-line)', background: 'rgba(0,0,0,0.26)',
          }}
        >
          <div style={{ fontSize: 13, letterSpacing: '0.14em', fontWeight: 600, color: 'var(--gold-bright)', marginBottom: 8 }}>
            {t.overallRank}
          </div>
          <Tiers tiers={guide.overall} />
        </div>
      </div>
    </div>
  );
}

export function GuideScene() {
  const { t } = useLang();

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

      <RoleGuideCard slot="core" x={60} />
      <RoleGuideCard slot="mid" x={666} />
      <RoleGuideCard slot="support" x={1272} />

      <div
        className="panel"
        style={{
          position: 'absolute', left: 60, top: FOOT_Y, width: 1800, height: FOOT_H,
          padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 24,
          background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
        }}
      >
        <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
          {(['top', 'mid', 'bad'] as const).map((tier) => (
            <span
              key={tier}
              style={{
                fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: TIER_COLOR[tier],
                border: `1px solid ${TIER_COLOR[tier]}`, borderRadius: 2, padding: '5px 12px',
              }}
            >
              {tier === 'top' ? t.tierTop : tier === 'mid' ? t.tierMid : t.tierBad}
            </span>
          ))}
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--gold-line)' }} />
        <div style={{ flex: 1, fontSize: 20, color: 'var(--text)', lineHeight: 1.45 }}>
          <b style={{ color: 'var(--warn)' }}>{t.guideFooterLead}</b> {t.guideFooterBody}
        </div>
      </div>
    </>
  );
}
