import swiss from '../../data/generated/swiss.json';
import { loadDataset } from '../../data/load';
import { BUCKET_ORDER, BUCKET_SLOTS } from '../../engine/swiss';
import type { Bucket } from '../../engine/swiss';
import { GoldRule } from '../../ui/primitives';
import { TeamLogo } from '../../ui/Portrait';
import { useLang } from '../../i18n/LangContext';
import { label } from '../../i18n/strings';
import { compareWithPro, loadProPicks } from '../../data/proPicks';
import { useMemo } from 'react';

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
  const comparisons = useMemo(
    () => loadProPicks().map((pro) => compareWithPro(picks, pro)),
    [],
  );
  const disagreements = useMemo(() => {
    const out = new Map<string, { who: string; theirs: Bucket }>();
    for (const c of comparisons) {
      for (const d of c.disagreements) out.set(d.teamId, { who: c.pro.name, theirs: d.theirs });
    }
    return out;
  }, [comparisons]);

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
        <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>
          {t.simulations(swiss._meta.iterations.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US'))}
        </span>
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

          {comparisons.map((c) => (
            <div key={c.pro.id} style={{ marginTop: 10, fontSize: 16, color: 'var(--text)' }}>
              <b style={{ color: 'var(--gold-bright)' }}>{c.pro.name}:</b>{' '}
              {c.agreements}/16 {lang === 'pt' ? 'iguais aos nossos' : 'the same as ours'}
              {c.disagreements.length > 0 && (
                <span style={{ color: 'var(--warn)' }}>
                  {' '}· {c.disagreements.length} {lang === 'pt' ? 'em amarelo na grade' : 'in yellow on the grid'}
                </span>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}> ({c.pro.source})</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
