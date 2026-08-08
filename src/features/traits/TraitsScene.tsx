import { useState } from 'react';
import { GoldRule } from '../../ui/primitives';
import {
  ALL_QUALITY_TIERS, ALL_TRAIT_IDS, QUALITY_BONUS, QUALITY_LABEL, TRAIT_DEFINITIONS,
} from '../../domain/emblems';
import type { Emblem, QualityTier, TraitId } from '../../domain/emblems';
import { DEFAULT_RULES } from '../../domain/rules';
import { emblemBonuses } from '../../engine/multipliers';
import { useLang } from '../../i18n/LangContext';
import type { AvoidId } from '../../i18n/strings';

/**
 * MEU ESTANDARTE — a mesma conta do cliente, com o que caiu pra voce.
 *
 * A versao anterior desta tela desenhava tres caixas VAZIAS pra ilustrar "quem o
 * traco afeta". Ninguem leu como diagrama: leu como formulario, tentou preencher
 * e nao aconteceu nada. A licao e que caixa vazia com borda E um convite pra
 * digitar — entao ou ela aceita entrada, ou ela nao pode parecer uma caixa.
 * Aqui ela aceita: escolher nivel e traco recalcula as porcentagens na hora.
 *
 * Ritmo vertical, somado:
 *    64  titulo
 *   108  simulador          (h 404)  ->  512
 *   526  seguranca x teto   (h 146)  ->  672
 *   686  os cinco tracos    (h 366)  -> 1052
 *
 * O simulador tinha crescido pra 470 porque a coluna da esquerda somava 425px de
 * conteudo numa largura de 320. Alargando a coluna pra 400 o paragrafo perde uma
 * linha e o painel volta a caber em 404 — foi assim que sobrou espaco pro
 * ranking sem espremer as cartas de referencia.
 *
 * A carta mais alta e a do AMIGAVEL: a dica dele tem quatro linhas contra duas ou
 * tres das outras, e como a dica e ancorada por `marginTop: auto`, faltar altura
 * nao corta por baixo — ela SOBE e cobre a linha "nos vizinhos". Com 340 ela
 * vazava 17px nos dois idiomas. Medir sempre por esta carta, nunca pela primeira.
 */
const SIM_Y = 108;
const SIM_H = 404;
const SIM_ASIDE_W = 400;
const RANK_Y = SIM_Y + SIM_H + 14;
const RANK_H = 146;
const REF_Y = RANK_Y + RANK_H + 14;
const REF_H = 366;

const REF_W = 348;
const REF_GAP = 16;

/** Largura de um emblema no simulador: o que sobra da faixa depois da coluna da esquerda. */
const SLOT_W = Math.floor((1800 - 48 - SIM_ASIDE_W - 49 - 32) / 3);

export type Slot = { readonly quality: QualityTier; readonly trait: TraitId };

/**
 * Quais erros do "Evite" estao acontecendo no estandarte montado.
 *
 * Funcao pura e exportada de proposito: e a unica logica desta tela que da pra
 * errar em silencio. Um acender trocado nao quebra layout nem lanca excecao —
 * so ensina a coisa errada, em tela cheia.
 */
export function activeAvoids(slots: readonly Slot[]): ReadonlySet<AvoidId> {
  const uniques = slots.filter((s) => s.trait === 'unique').length;
  const friendlies = slots.filter((s) => s.trait === 'friendly').length;
  const distinct = new Set(slots.map((s) => s.quality)).size === slots.length;

  const active = new Set<AvoidId>();
  if (friendlies > 0 && friendlies < 3) active.add('friendlyIncomplete');
  if (uniques > 1) active.add('twoUniques');
  if (slots.some((s) => s.trait === 'fractal') && !distinct) active.add('fractalRepeated');
  if (slots[1]?.trait === 'vampiric') active.add('vampiricMiddle');
  return active;
}

/**
 * Um estado inicial que ja mostra a graca da coisa: tres niveis DIFERENTES com
 * Fractal nos tres. Baixar qualquer qualidade pra repetir outra derruba os tres
 * de uma vez — que e a armadilha que nenhuma calculadora publica avisa.
 */
const INITIAL: readonly Slot[] = [
  { quality: 4, trait: 'fractal' },
  { quality: 3, trait: 'fractal' },
  { quality: 5, trait: 'fractal' },
];

const selectStyle: React.CSSProperties = {
  font: 'inherit', fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '100%',
  padding: '8px 10px', borderRadius: 3,
  border: '1px solid var(--gold-line)',
  background: 'rgba(0,0,0,0.35)', color: 'var(--gold-bright)',
};

const optionStyle: React.CSSProperties = { background: 'var(--bg-panel)', color: 'var(--text)' };

/** `emblemBonuses` so olha qualidade, traco e posicao — cor e stat sao inertes aqui. */
function toEmblems(slots: readonly Slot[]): readonly Emblem[] {
  return slots.map((s, index) => ({
    index, color: 'red' as const, statId: 'gpm' as const, quality: s.quality, trait: s.trait,
  }));
}

/** Por que um traco que deveria pagar esta valendo zero. Vazio = esta pagando. */
function zeroReason(slots: readonly Slot[], i: number, lang: 'pt' | 'en'): string {
  const trait = slots[i].trait;
  const qualities = slots.map((s) => s.quality);
  const distinct = new Set(qualities).size === qualities.length;
  const uniques = slots.filter((s) => s.trait === 'unique').length;
  const friendlies = slots.filter((s) => s.trait === 'friendly').length;

  if (trait === 'fractal' && !distinct) return lang === 'pt' ? 'níveis repetidos' : 'repeated tiers';
  if (trait === 'unique' && uniques > 1) return lang === 'pt' ? 'há outro Único' : 'another Unique';
  if (trait === 'friendly' && friendlies < 3) return lang === 'pt' ? `só ${friendlies} de 3` : `only ${friendlies} of 3`;
  if (trait === 'benevolent') return lang === 'pt' ? 'só age nos vizinhos' : 'only affects neighbours';
  return '';
}

function EmblemSlot({
  index, slots, onChange, x, w,
}: {
  readonly index: number;
  readonly slots: readonly Slot[];
  readonly onChange: (index: number, next: Slot) => void;
  readonly x: number;
  readonly w: number;
}) {
  const { lang, t } = useLang();
  const slot = slots[index];
  const bonus = emblemBonuses(toEmblems(slots), DEFAULT_RULES)[index];
  const total = Math.round(bonus.multiplier * 100);
  const reason = zeroReason(slots, index, lang);
  const traitName = lang === 'pt' ? TRAIT_DEFINITIONS[slot.trait].labelPtBr : TRAIT_DEFINITIONS[slot.trait].labelEn;

  const pct = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : '+'}${Math.abs(Math.round(v * 100))}`;

  return (
    <div
      style={{
        position: 'absolute', left: x, top: 0, width: w, bottom: 0,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: '0.16em', color: 'var(--text-faint)' }}>
        {t.emblemWord} {index + 1}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <label style={{ flex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 4 }}>{t.qualityTitle}</div>
          <select
            style={selectStyle}
            value={slot.quality}
            onChange={(e) => onChange(index, { ...slot, quality: Number(e.target.value) as QualityTier })}
          >
            {ALL_QUALITY_TIERS.map((tier) => (
              <option key={tier} value={tier} style={optionStyle}>
                {t.tierWord} {QUALITY_LABEL[tier]} · +{Math.round(QUALITY_BONUS[tier] * 100)}%
              </option>
            ))}
          </select>
        </label>

        <label style={{ flex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 4 }}>{t.traitWord}</div>
          <select
            style={selectStyle}
            value={slot.trait}
            onChange={(e) => onChange(index, { ...slot, trait: e.target.value as TraitId })}
          >
            {ALL_TRAIT_IDS.map((id) => (
              <option key={id} value={id} style={optionStyle}>
                {lang === 'pt' ? TRAIT_DEFINITIONS[id].labelPtBr : TRAIT_DEFINITIONS[id].labelEn}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* O RESULTADO — na convencao do cliente: total, nao bonus. */}
      <div
        style={{
          marginTop: 16, flex: 1, borderRadius: 3,
          border: '1px solid var(--gold-line)', background: 'rgba(0,0,0,0.26)',
          padding: '14px 16px', display: 'flex', flexDirection: 'column',
        }}
      >
        <div className="numeral" style={{ fontSize: 68, fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 1 }}>
          {total}%
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 14, color: 'var(--text-dim)' }}>
          <div><span className="numeral" style={{ color: 'var(--text)' }}>100</span> {t.baseWord}</div>
          <div>
            <span className="numeral" style={{ color: '#8fd46e' }}>{pct(bonus.quality)}</span>{' '}
            {t.tierWord} {QUALITY_LABEL[slot.quality]}
          </div>
          <div>
            <span className="numeral" style={{ color: bonus.ownTrait > 0 ? '#8fd46e' : 'var(--text-faint)' }}>
              {pct(bonus.ownTrait)}
            </span>{' '}
            {traitName}
            {reason && <span style={{ color: 'var(--warn)' }}> ({reason})</span>}
          </div>
          <div>
            <span
              className="numeral"
              style={{ color: bonus.adjacency > 0 ? '#8fd46e' : bonus.adjacency < 0 ? '#f0705e' : 'var(--text-faint)' }}
            >
              {pct(bonus.adjacency)}
            </span>{' '}
            {t.neighboursWord}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * POR SEGURANCA E POR TETO — o ranking das montagens.
 *
 * As duas primeiras colunas sao referencia fixa. A terceira NAO e: cada linha do
 * "Evite" acende quando o erro esta acontecendo no estandarte montado logo acima.
 * Sem isso seria mais um cartaz; com isso a tela diz "voce esta fazendo ISTO
 * agora", que e a unica coisa que muda a mao de quem esta com a ficha na mao.
 */
function RankingBand({ active }: { readonly active: ReadonlySet<AvoidId> }) {
  const { t } = useLang();

  const column = (title: string, items: readonly { readonly lead: string; readonly body: string }[]) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--gold)' }}>{title}</div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={item.lead} style={{ display: 'flex', gap: 8, fontSize: 14, lineHeight: 1.35, color: 'var(--text-dim)' }}>
            <span className="numeral" style={{ color: 'var(--gold-dim)', flexShrink: 0 }}>{i + 1}.</span>
            <span>
              <b style={{ color: 'var(--text)' }}>{item.lead}</b> — {item.body}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="panel"
      style={{
        position: 'absolute', left: 60, top: RANK_Y, width: 1800, height: RANK_H,
        padding: '14px 26px', display: 'flex', gap: 22, alignItems: 'stretch', overflow: 'hidden',
        background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
      }}
    >
      {column(t.safestTitle, t.safest)}
      <div style={{ width: 1, background: 'var(--gold-line)' }} />
      {column(t.ceilingTitle, t.ceiling)}
      <div style={{ width: 1, background: 'var(--gold-line)' }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--warn)' }}>{t.avoidTitle}</div>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(Object.keys(t.avoid) as AvoidId[]).map((id) => {
            const on = active.has(id);
            return (
              <div
                key={id}
                style={{
                  display: 'flex', gap: 8, alignItems: 'baseline',
                  fontSize: 14, lineHeight: 1.35,
                  color: on ? 'var(--warn)' : 'var(--text-dim)',
                  fontWeight: on ? 700 : 400,
                }}
              >
                <span style={{ flexShrink: 0, color: on ? 'var(--warn)' : 'var(--text-faint)' }}>{on ? '▶' : '·'}</span>
                <span>{t.avoid[id]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TraitCard({ trait, x }: { readonly trait: TraitId; readonly x: number }) {
  const { lang, t } = useLang();
  const def = TRAIT_DEFINITIONS[trait];

  return (
    <div
      className="panel"
      style={{
        position: 'absolute', left: x, top: REF_Y, width: REF_W, height: REF_H,
        padding: '20px 22px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="display" style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold-bright)' }}>
          {lang === 'pt' ? def.labelPtBr : def.labelEn}
        </span>
      </div>

      <GoldRule style={{ margin: '10px 0 14px' }} />

      <div style={{ fontSize: 15, lineHeight: 1.45, color: 'var(--text)' }}>
        {lang === 'pt' ? def.descriptionPtBr : def.descriptionEn}
      </div>

      {/*
        Os dois numeros que a descricao oficial mistura numa frase so. Em texto,
        nao em caixa: a versao anterior desenhava tres retangulos vazios aqui e
        todo mundo tentou digitar dentro deles.
      */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 14, color: 'var(--text-dim)' }}>
          <span>{t.onItself}</span>
          <span className="numeral" style={{ fontSize: 20, fontWeight: 700, color: def.selfBonus > 0 ? '#8fd46e' : 'var(--text-faint)' }}>
            {def.selfBonus > 0 ? `+${Math.round(def.selfBonus * 100)}%` : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 14, color: 'var(--text-dim)' }}>
          <span>{t.onNeighbours}</span>
          <span
            className="numeral"
            style={{
              fontSize: 20, fontWeight: 700,
              color: def.neighborBonus > 0 ? '#8fd46e' : def.neighborBonus < 0 ? '#f0705e' : 'var(--text-faint)',
            }}
          >
            {def.neighborBonus === 0 ? '—' : `${def.neighborBonus > 0 ? '+' : '−'}${Math.abs(Math.round(def.neighborBonus * 100))}%`}
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: 'auto', padding: '12px 14px', borderRadius: 2,
          border: '1px solid var(--gold-line)', background: 'rgba(0,0,0,0.26)',
          fontSize: 14, lineHeight: 1.45, color: 'var(--text-dim)',
        }}
      >
        {lang === 'pt' ? def.tipPtBr : def.tipEn}
      </div>
    </div>
  );
}

export function TraitsScene() {
  const { t } = useLang();
  const [slots, setSlots] = useState<readonly Slot[]>(INITIAL);
  const change = (index: number, next: Slot) =>
    setSlots((prev) => prev.map((s, i) => (i === index ? next : s)));

  const total = emblemBonuses(toEmblems(slots), DEFAULT_RULES)
    .reduce((acc, b) => acc + b.multiplier, 0);

  const tiers = slots.map((s) => QUALITY_LABEL[s.quality]).join(' / ');
  const distinct = new Set(slots.map((s) => s.quality)).size === slots.length;
  const uniques = slots.filter((s) => s.trait === 'unique').length;
  const friendlies = slots.filter((s) => s.trait === 'friendly').length;
  const conditions = [
    { on: distinct, label: t.condFractal(tiers) },
    { on: uniques === 1, label: t.condUnique(uniques) },
    { on: friendlies >= 3, label: t.condFriendly(friendlies) },
  ];

  const active = activeAvoids(slots);

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

      {/* O SIMULADOR */}
      <div
        className="panel"
        style={{
          position: 'absolute', left: 60, top: SIM_Y, width: 1800, height: SIM_H,
          padding: '20px 24px',
          background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
        }}
      >
        <div style={{ position: 'absolute', inset: '20px 24px', display: 'flex', gap: 24 }}>
          <div style={{ width: SIM_ASIDE_W, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="display" style={{ fontSize: 23, color: 'var(--gold-bright)', lineHeight: 1.2 }}>
              {t.simTitle}
            </div>
            <div style={{ fontSize: 15, color: 'var(--text)', marginTop: 12, lineHeight: 1.5 }}>
              {t.simHowTo}
            </div>

            {/*
              Estado das condicoes que valem pro ESTANDARTE INTEIRO.
              Sem isto, ver "+60 Fractal" em cada emblema levanta a duvida certa:
              ele esta pagando porque os niveis sao diferentes, ou porque o codigo
              esqueceu de conferir? A tela agora responde antes de perguntarem.
            */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--gold)' }}>{t.bannerConditions}</div>
              {conditions.map((c) => (
                <div key={c.label} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 13 }}>
                  <span style={{ color: c.on ? '#8fd46e' : 'var(--text-faint)', fontWeight: 700 }}>{c.on ? 'ON' : 'OFF'}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{c.label}</span>
                </div>
              ))}
            </div>

            {/*
              Espaco FIXO, nao `marginTop: auto`.
              Ancorado no rodape, este bloco descolava bonito em portugues e
              grudava no "Amigavel — 0 de 3" em ingles, onde o paragrafo e uma
              linha maior: o auto vira zero exatamente quando a coluna enche.
              Separacao garantida vale mais que alinhamento no rodape.
            */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--gold)' }}>{t.bannerTotal}</div>
              <div className="numeral" style={{ fontSize: 46, fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 1.1 }}>
                {Math.round(total * 100)}%
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.4, marginTop: 4 }}>
                {t.bannerTotalNote}
              </div>
            </div>
          </div>

          <div style={{ width: 1, background: 'var(--gold-line)' }} />

          <div style={{ flex: 1, position: 'relative' }}>
            {[0, 1, 2].map((i) => (
              <EmblemSlot key={i} index={i} slots={slots} onChange={change} x={i * (SLOT_W + 16)} w={SLOT_W} />
            ))}
          </div>
        </div>
      </div>

      <RankingBand active={active} />

      {/* OS CINCO TRACOS, como referencia */}
      {ALL_TRAIT_IDS.map((trait, i) => (
        <TraitCard key={trait} trait={trait} x={60 + i * (REF_W + REF_GAP)} />
      ))}
    </>
  );
}
