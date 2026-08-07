import swiss from '../../data/generated/swiss.json';
import { loadDataset } from '../../data/load';
import { BUCKET_ORDER, BUCKET_SLOTS } from '../../engine/swiss';
import type { Bucket } from '../../engine/swiss';
import { GoldRule } from '../../ui/primitives';
import { TeamLogo } from '../../ui/Portrait';
import { useLang } from '../../i18n/LangContext';
import { label } from '../../i18n/strings';
import { compareWithPro, loadProPicks } from '../../data/proPicks';
import { UNTOUCHED_PICKS } from '../../data/baselinePicks';
import { useEffect, useMemo, useState } from 'react';

const picks = swiss.picks as Record<string, Bucket>;
const stability = swiss.stability as Record<string, number>;
const probability = swiss.bucketProbability as Record<string, Record<Bucket, number>>;

/** Mesma ordem de leitura da tela do cliente — o publico reconhece na hora. */
const TOP_ROW: readonly Bucket[] = ['4-0', '4-1', 'elimWin'];
const BOTTOM_ROW: readonly Bucket[] = ['elimLose', '1-4', '0-4'];

const CARD_W = 206;
const CARD_H = 268;
const GAP = 12;

function TeamCard({ teamId, bucket, name, x, y, disagreesWith }: {
  readonly teamId: string; readonly bucket: Bucket; readonly name: string;
  readonly x: number; readonly y: number;
  /** Quem palpitou DIFERENTE neste time, e onde ele pos. Vazio = todo mundo concorda. */
  readonly disagreesWith?: { readonly who: string; readonly theirs: Bucket };
}) {
  const { lang, t } = useLang();
  const p = probability[teamId][bucket];
  const stable = stability[teamId] === swiss.maxStability;
  const shaky = stability[teamId] <= 1;

  return (
    <div
      className="panel"
      style={{
        position: 'absolute', left: x, top: y, width: CARD_W, height: CARD_H,
        padding: '16px 12px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', alignItems: 'center', textAlign: 'center',
        borderColor: stable ? 'var(--gold-bright)' : shaky ? 'var(--warn)' : 'var(--gold-line)',
        borderWidth: stable ? 2 : 1,
        background: stable
          ? 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)'
          : 'linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-mid) 100%)',
      }}
    >
      <div
        style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', padding: '4px 12px', borderRadius: 2,
          background: stable ? 'var(--ok)' : shaky ? 'var(--warn)' : 'transparent',
          border: `1px solid ${stable ? 'var(--ok)' : shaky ? 'var(--warn)' : 'var(--gold-dim)'}`,
          color: stable || shaky ? '#1b1006' : 'var(--gold)',
        }}
      >
        {stable ? t.badgeFirm : shaky ? t.badgeGuess : t.badgeLikely}
      </div>

      <TeamLogo teamId={teamId} size={74} />

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 1.12 }}>
        {name}
      </div>

      <div className="numeral" style={{ fontSize: 38, color: 'var(--text)', lineHeight: 0.9 }}>
        {(p * 100).toFixed(0)}<span style={{ fontSize: 19, color: 'var(--text-dim)' }}>%</span>
      </div>

      {/* Discordancia: so aparece quando alguem de verdade palpitou diferente. */}
      {disagreesWith && (
        <div
          style={{
            position: 'absolute', left: -2, right: -2, bottom: -14,
            background: 'var(--warn)', color: '#1b1006', borderRadius: 2,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
            padding: '3px 6px', textAlign: 'center', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {disagreesWith.who}: {label.bucket(disagreesWith.theirs, lang)}
        </div>
      )}
    </div>
  );
}

function BucketGroup({ bucket, teams, x, y, names, disagreements }: {
  readonly bucket: Bucket; readonly teams: readonly string[];
  readonly x: number; readonly y: number; readonly names: ReadonlyMap<string, string>;
  readonly disagreements: ReadonlyMap<string, { readonly who: string; readonly theirs: Bucket }>;
}) {
  const { lang, t } = useLang();
  const width = BUCKET_SLOTS[bucket] * CARD_W + (BUCKET_SLOTS[bucket] - 1) * GAP;

  return (
    <>
      <div style={{ position: 'absolute', left: x, top: y, width, textAlign: 'center' }}>
        <div className="display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold-bright)' }}>
          {label.bucket(bucket, lang)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{t.bucketSubtitle[bucket]}</div>
        <GoldRule style={{ marginTop: 8 }} />
      </div>
      {teams.map((teamId, i) => (
        <TeamCard
          key={teamId}
          teamId={teamId}
          bucket={bucket}
          name={names.get(teamId) ?? teamId}
          x={x + i * (CARD_W + GAP)}
          y={y + 56}
          disagreesWith={disagreements.get(teamId)}
        />
      ))}
    </>
  );
}

export function PredictionsScene() {
  const { lang, t } = useLang();
  const names = useMemo(() => {
    const data = loadDataset();
    return new Map([...data.teams].map(([id, team]) => [id, team.name]));
  }, []);

  const byBucket = (bucket: Bucket) => Object.keys(picks).filter((id) => picks[id] === bucket);

  const expectedHits = Object.entries(picks)
    .reduce((acc, [id, bucket]) => acc + probability[id][bucket], 0);
  const firm = Object.values(stability).filter((s) => s === swiss.maxStability).length;

  /**
   * Quanto acerta quem sorteia os 16 times nas 16 vagas.
   *
   * Numa permutacao ao acaso, a chance de um time cair no balde certo e
   * vagas(b)/16, e ha vagas(b) times naquele balde — entao o total e a soma de
   * vagas(b)^2 / 16 = (1+4+25+25+4+1)/16 = 3,75. E a regua honesta: sem ela o
   * "5,1 de 16" parece derrota quando na verdade e 36% acima do acaso.
   */
  const randomBaseline = BUCKET_ORDER
    .reduce((acc, b) => acc + BUCKET_SLOTS[b] ** 2, 0) / 16;

  /**
   * Comparacao com palpite de profissional.
   *
   * So aparece quando ha dado REAL em proPicks.json. Enquanto ninguem tiver
   * publicado, a tela nao muda em nada — melhor ausencia que invencao.
   */
  const pros = useMemo(() => loadProPicks(), []);

  /**
   * Adversarios da comparacao.
   *
   * O primeiro sempre existe: "quem nao mexeu", a ordem que o cliente ja vem
   * preenchido. Os profissionais entram depois, quando publicarem de verdade.
   */
  const opponents = useMemo(() => {
    const base = {
      id: 'untouched',
      name: lang === 'pt' ? 'Quem nao mexeu' : 'Not touching it',
      source: lang === 'pt'
        ? 'ordem que o cliente ja vem preenchido'
        : "the client's pre-filled order",
      capturedAt: '2026-08-07',
      picks: UNTOUCHED_PICKS,
    };
    return [base, ...pros];
  }, [lang, pros]);

  const [opponentIndex, setOpponentIndex] = useState(0);
  const [comparing, setComparing] = useState(false);

  // Tecla 3 liga/desliga a comparacao; 4 troca de adversario quando houver mais de um.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '3') setComparing((v) => !v);
      if (e.key === '4') setOpponentIndex((i) => (i + 1) % opponents.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opponents.length]);

  const active = opponents[Math.min(opponentIndex, opponents.length - 1)];
  const comparison = useMemo(() => compareWithPro(picks, active), [active]);

  const disagreements = useMemo(() => {
    if (!comparing) return new Map<string, { who: string; theirs: Bucket }>();
    return new Map(
      comparison.disagreements.map((d) => [d.teamId, { who: active.name, theirs: d.theirs }]),
    );
  }, [comparing, comparison, active.name]);

  const opponentHits = Object.entries(active.picks)
    .reduce((acc, [id, b]) => acc + (probability[id]?.[b] ?? 0), 0);

  let x = 60;
  const topPositions = TOP_ROW.map((g) => {
    const pos = x;
    x += BUCKET_SLOTS[g] * CARD_W + (BUCKET_SLOTS[g] - 1) * GAP + 46;
    return pos;
  });
  x = 60;
  const bottomPositions = BOTTOM_ROW.map((g) => {
    const pos = x;
    x += BUCKET_SLOTS[g] * CARD_W + (BUCKET_SLOTS[g] - 1) * GAP + 46;
    return pos;
  });

  return (
    <>
      <div style={{ position: 'absolute', top: 26, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="display" style={{ fontSize: 22, letterSpacing: '0.24em', color: 'var(--gold-bright)' }}>
          {t.predictionsTitle} &nbsp;·&nbsp; {t.groupStage}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setComparing((v) => !v)}
            style={{
              font: 'inherit', cursor: 'pointer', fontSize: 14, letterSpacing: '0.08em',
              padding: '7px 16px', borderRadius: 3,
              border: `2px solid ${comparing ? 'var(--warn)' : 'var(--gold-line)'}`,
              color: comparing ? '#1b1006' : 'var(--gold)',
              background: comparing ? 'var(--warn)' : 'rgba(0,0,0,0.30)',
              fontWeight: comparing ? 700 : 500,
            }}
          >
            3 · {lang === 'pt' ? 'COMPARAR COM' : 'COMPARE VS'} {active.name.toUpperCase()}
          </button>
          {comparing && opponents.length > 1 && (
            <button
              type="button"
              onClick={() => setOpponentIndex((i) => (i + 1) % opponents.length)}
              style={{
                font: 'inherit', cursor: 'pointer', fontSize: 14, padding: '7px 14px',
                borderRadius: 3, border: '2px solid var(--gold-line)',
                color: 'var(--gold)', background: 'rgba(0,0,0,0.30)',
              }}
            >
              4 · {lang === 'pt' ? 'TROCAR' : 'SWITCH'}
            </button>
          )}
          <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>
            {t.simulations(swiss._meta.iterations.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US'))}
          </span>
        </div>
      </div>

      {TOP_ROW.map((b, i) => (
        <BucketGroup key={b} bucket={b} teams={byBucket(b)} x={topPositions[i]} y={78} names={names} disagreements={disagreements} />
      ))}
      {BOTTOM_ROW.map((b, i) => (
        <BucketGroup key={b} bucket={b} teams={byBucket(b)} x={bottomPositions[i]} y={452} names={names} disagreements={disagreements} />
      ))}

      {/*
        O numero de acertos esperados sozinho parece derrota. O que da sentido a
        ele e a COMPARACAO com o chute: quem sorteia os 16 times nas 16 vagas
        acerta 3,75 (soma de vagas ao quadrado / 16). Mostrar so o 5,1 escondia
        justamente a informacao que prova que ele e bom.
      */}
      <div
        className="panel"
        style={{
          position: 'absolute', left: 60, top: 820, width: 1800, height: 180, padding: '20px 30px',
          display: 'flex', gap: 26, alignItems: 'stretch',
          background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
        }}
      >
        <div
          style={{
            width: 300, borderRadius: 3, border: '2px solid var(--ok)',
            background: 'rgba(108,187,85,0.12)', padding: '14px 20px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="numeral" style={{ fontSize: 76, color: 'var(--ok)', lineHeight: 0.85 }}>{firm}</span>
            <span className="numeral" style={{ fontSize: 32, color: 'var(--text-dim)' }}>{t.outOf16}</span>
          </div>
          <div style={{ fontSize: 17, color: 'var(--text)', marginTop: 8, fontWeight: 600 }}>
            {t.firmPicks}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>
            {t.firmSubtitle}
          </div>
        </div>

        <div
          style={{
            width: 340, borderRadius: 3, border: '1px solid var(--gold-line)',
            background: 'rgba(0,0,0,0.22)', padding: '14px 20px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span className="numeral" style={{ fontSize: 62, color: 'var(--gold-bright)', lineHeight: 0.85 }}>
              {expectedHits.toFixed(1)}
            </span>
            <span style={{ fontSize: 22, color: 'var(--text-dim)' }}>
              {t.vsRandom(randomBaseline.toFixed(1))}
            </span>
          </div>
          <div style={{ fontSize: 17, color: 'var(--text)', marginTop: 8, fontWeight: 600 }}>
            {t.expectedHits}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>
            {t.aboveRandom(((expectedHits / randomBaseline - 1) * 100).toFixed(0))}
          </div>
        </div>

        <div style={{ flex: 1, fontSize: 18, color: 'var(--text)', lineHeight: 1.5, alignSelf: 'center' }}>
          <b style={{ color: 'var(--gold-bright)' }}>{t.ceilingLead}</b> {t.ceilingBody}
          <div style={{ marginTop: 9, fontSize: 16, color: 'var(--warn)' }}>
            <b>4-0</b> / <b>4-1</b> {t.weakestLead} {t.weakestBody}
          </div>

          {/* Confronto: so aparece com o modo ligado, e sempre com a fonte junto. */}
          {comparing && (
            <div
              style={{
                marginTop: 11, padding: '9px 13px', borderRadius: 3,
                border: '1px solid var(--warn)', background: 'rgba(217,138,58,0.12)',
                fontSize: 16, color: 'var(--text)',
              }}
            >
              <b style={{ color: 'var(--gold-bright)' }}>{active.name}</b>
              {' '}<span className="numeral" style={{ fontSize: 20 }}>{opponentHits.toFixed(1)}</span>
              {' '}{lang === 'pt' ? 'contra os nossos' : 'against our'}{' '}
              <span className="numeral" style={{ fontSize: 20, color: 'var(--gold-bright)' }}>{expectedHits.toFixed(1)}</span>
              {' · '}
              <b style={{ color: 'var(--warn)' }}>{comparison.disagreements.length}</b>{' '}
              {lang === 'pt' ? 'discordancias em amarelo na grade' : 'disagreements in yellow on the grid'}
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}> — {active.source}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
