import { GoldRule } from '../../ui/primitives';
import { ALL_QUALITY_TIERS, ALL_TRAIT_IDS, QUALITY_BONUS, QUALITY_LABEL, TRAIT_DEFINITIONS } from '../../domain/emblems';
import type { TraitId } from '../../domain/emblems';
import { useLang } from '../../i18n/LangContext';

/**
 * A ficha de consulta do estandarte: as 5 qualidades e os 5 tracos.
 *
 * Estava so implicita no site — o Dota dos Sonhos dizia "alvo: Fractal" sem
 * nenhum lugar explicando o que Fractal faz. Aqui o texto e o do CLIENTE, e
 * embaixo de cada um vem o desenho de quem ele afeta, que e o que a descricao
 * oficial nao mostra.
 *
 * Ritmo vertical, somado:
 *    64  titulo
 *   108  faixa das qualidades (h 150)   -> 258
 *   276  os cinco tracos    (h 470)     -> 746
 *   762  a regra da soma    (h 190)     -> 952
 */
const QUAL_Y = 108;
const QUAL_H = 150;
const TRAIT_Y = QUAL_Y + QUAL_H + 18;
const TRAIT_H = 470;
const RULE_Y = TRAIT_Y + TRAIT_H + 16;
const RULE_H = 190;

const CARD_W = 348;
const CARD_GAP = 16;

/**
 * O efeito do traco num estandarte de TRES emblemas, com ele no do meio.
 *
 * `null` = aquele emblema nao muda. E o desenho que responde a pergunta que a
 * descricao do jogo deixa no ar: "adjacente" quer dizer quantos?
 */
const EFFECT: Readonly<Record<Exclude<TraitId, 'none'>, readonly (string | null)[]>> = {
  fractal: [null, '+60%', null],
  benevolent: ['+20%', null, '+20%'],
  vampiric: ['−10%', '+50%', '−10%'],
  unique: [null, '+30%', null],
  friendly: ['+50%', '+50%', '+50%'],
};

/** Se o traco precisa dos TRES emblemas pra valer, os tres aparecem marcados. */
const NEEDS_ALL: Readonly<Record<string, boolean>> = { friendly: true };

function EffectDiagram({ trait }: { readonly trait: Exclude<TraitId, 'none'> }) {
  const cells = EFFECT[trait];

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {cells.map((value, i) => {
        const isSelf = i === 1;
        const marked = NEEDS_ALL[trait] || isSelf;
        const negative = value?.startsWith('−');
        return (
          <div key={i} style={{ width: 92, textAlign: 'center' }}>
            <div
              style={{
                height: 52, borderRadius: 3,
                border: `2px solid ${marked ? 'var(--gold-bright)' : 'var(--gold-line)'}`,
                background: marked ? 'rgba(255,228,163,0.14)' : 'rgba(0,0,0,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, letterSpacing: '0.06em',
                color: marked ? 'var(--gold-bright)' : 'var(--text-faint)',
                fontWeight: marked ? 700 : 400,
              }}
            >
              {marked ? '★' : ''}
            </div>
            <div
              className="numeral"
              style={{
                marginTop: 6, fontSize: 20, fontWeight: 600,
                color: value ? (negative ? '#f0705e' : '#8fd46e') : 'var(--text-faint)',
              }}
            >
              {value ?? '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TraitCard({ trait, x }: { readonly trait: Exclude<TraitId, 'none'>; readonly x: number }) {
  const { lang, t } = useLang();
  const def = TRAIT_DEFINITIONS[trait];

  return (
    <div
      className="panel"
      style={{
        position: 'absolute', left: x, top: TRAIT_Y, width: CARD_W, height: TRAIT_H,
        padding: '20px 22px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
      }}
    >
      <div className="display" style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold-bright)' }}>
        {lang === 'pt' ? def.labelPtBr : def.labelEn}
      </div>

      <GoldRule style={{ margin: '10px 0 14px' }} />

      <div style={{ fontSize: 15, lineHeight: 1.45, color: 'var(--text)', minHeight: 130 }}>
        {lang === 'pt' ? def.descriptionPtBr : def.descriptionEn}
      </div>

      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--text-faint)', textAlign: 'center', marginBottom: 8 }}>
          {t.traitAffects}
        </div>
        <EffectDiagram trait={trait} />
      </div>

      <div
        style={{
          marginTop: 'auto', padding: '10px 12px', borderRadius: 2,
          border: '1px solid var(--gold-line)', background: 'rgba(0,0,0,0.26)',
          fontSize: 13, lineHeight: 1.4, color: 'var(--text-dim)',
        }}
      >
        {lang === 'pt' ? def.tipPtBr : def.tipEn}
      </div>
    </div>
  );
}

export function TraitsScene() {
  const { t } = useLang();

  return (
    <>
      <div style={{ position: 'absolute', top: 64, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="display" style={{ fontSize: 19, letterSpacing: '0.18em', color: 'var(--gold-bright)' }}>
          {t.traitsTitle}
        </span>
        <span style={{ fontSize: 14, letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
          {t.traitsSubtitle}
        </span>
      </div>

      {/* AS CINCO QUALIDADES */}
      <div
        className="panel"
        style={{
          position: 'absolute', left: 60, top: QUAL_Y, width: 1800, height: QUAL_H,
          padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 24,
          background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
        }}
      >
        <div style={{ width: 190, flexShrink: 0 }}>
          <div className="display" style={{ fontSize: 21, color: 'var(--gold-bright)' }}>{t.qualityTitle}</div>
          <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 6, lineHeight: 1.35 }}>{t.qualityNote}</div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--gold-line)' }} />
        <div style={{ flex: 1, display: 'flex', gap: 14 }}>
          {ALL_QUALITY_TIERS.map((tier) => (
            <div
              key={tier}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 3, textAlign: 'center',
                border: '1px solid var(--gold-line)', background: 'rgba(0,0,0,0.26)',
              }}
            >
              <div className="display" style={{ fontSize: 24, color: 'var(--gold)' }}>{t.tierWord} {QUALITY_LABEL[tier]}</div>
              <div className="numeral" style={{ fontSize: 34, fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 1.1 }}>
                +{Math.round(QUALITY_BONUS[tier] * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OS CINCO TRACOS */}
      {ALL_TRAIT_IDS.map((trait, i) => (
        <TraitCard key={trait} trait={trait as Exclude<TraitId, 'none'>} x={60 + i * (CARD_W + CARD_GAP)} />
      ))}

      {/* COMO OS PEDACOS SE SOMAM — com o exemplo de um estandarte real */}
      <div
        className="panel"
        style={{
          position: 'absolute', left: 60, top: RULE_Y, width: 1800, height: RULE_H,
          padding: '18px 28px', display: 'flex', gap: 28, alignItems: 'stretch',
          background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, letterSpacing: '0.14em', color: 'var(--gold)' }}>{t.sumTitle}</div>
          <div className="display" style={{ fontSize: 27, color: 'var(--gold-bright)', marginTop: 10, lineHeight: 1.25 }}>
            {t.sumFormula}
          </div>
          <div style={{ fontSize: 16, color: 'var(--text)', marginTop: 12, lineHeight: 1.45 }}>
            {t.sumBody}
          </div>
        </div>

        <div style={{ width: 1, background: 'var(--gold-line)' }} />

        <div style={{ width: 720, flexShrink: 0 }}>
          <div style={{ fontSize: 14, letterSpacing: '0.14em', color: 'var(--gold)' }}>{t.exampleTitle}</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { name: 'OPM', total: '250%', parts: '100 + 100 (Nível IV) + 50 (Vampírico)' },
              { name: 'Roshans Mortos', total: '120%', parts: '100 + 30 (Nível II) − 10 (vizinho Vampírico)' },
              { name: 'Finalizações', total: '110%', parts: '100 + 10 (Nível I) + 0 (Único, porque há dois)' },
            ].map((row) => (
              <div key={row.name} style={{ display: 'flex', alignItems: 'baseline', gap: 12, fontSize: 15 }}>
                <span style={{ width: 150, flexShrink: 0, color: 'var(--text-dim)' }}>{row.name}</span>
                <span className="numeral" style={{ width: 58, flexShrink: 0, fontSize: 20, fontWeight: 700, color: 'var(--gold-bright)' }}>
                  {row.total}
                </span>
                <span style={{ color: 'var(--text)' }}>{row.parts}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 10, lineHeight: 1.4 }}>
            {t.exampleNote}
          </div>
        </div>
      </div>
    </>
  );
}
