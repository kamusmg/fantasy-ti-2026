import swiss from '../../data/generated/swiss.json';
import { loadDataset } from '../../data/load';
import { BUCKET_LABEL_PT_BR, BUCKET_ORDER, BUCKET_SLOTS } from '../../engine/swiss';
import type { Bucket } from '../../engine/swiss';
import { GoldRule } from '../../ui/primitives';
import { TeamLogo } from '../../ui/Portrait';
import { useMemo } from 'react';

const picks = swiss.picks as Record<string, Bucket>;
const stability = swiss.stability as Record<string, number>;
const probability = swiss.bucketProbability as Record<string, Record<Bucket, number>>;

interface Group {
  readonly bucket: Bucket;
  readonly subtitle: string;
}

/** Mesma ordem de leitura da tela do cliente — o publico reconhece na hora. */
const TOP_ROW: readonly Group[] = [
  { bucket: '4-0', subtitle: 'Uma equipe invicta.' },
  { bucket: '4-1', subtitle: 'Duas equipes com quatro vitorias e uma derrota.' },
  { bucket: 'elimWin', subtitle: 'As cinco equipes vencedoras da rodada eliminatoria.' },
];
const BOTTOM_ROW: readonly Group[] = [
  { bucket: 'elimLose', subtitle: 'As cinco equipes perdedoras da rodada eliminatoria.' },
  { bucket: '1-4', subtitle: 'Duas equipes com uma vitoria e quatro derrotas.' },
  { bucket: '0-4', subtitle: 'Uma equipe sem vitorias.' },
];

const CARD_W = 206;
const CARD_H = 268;
const GAP = 12;

function TeamCard({ teamId, bucket, name, x, y }: {
  readonly teamId: string; readonly bucket: Bucket; readonly name: string;
  readonly x: number; readonly y: number;
}) {
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
        {stable ? 'FIRME' : shaky ? 'CHUTE' : 'PROVAVEL'}
      </div>

      <TeamLogo teamId={teamId} size={74} />

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 1.12 }}>
        {name}
      </div>

      <div className="numeral" style={{ fontSize: 38, color: 'var(--text)', lineHeight: 0.9 }}>
        {(p * 100).toFixed(0)}<span style={{ fontSize: 19, color: 'var(--text-dim)' }}>%</span>
      </div>
    </div>
  );
}

function BucketGroup({ group, teams, x, y, names }: {
  readonly group: Group; readonly teams: readonly string[];
  readonly x: number; readonly y: number; readonly names: ReadonlyMap<string, string>;
}) {
  const width = BUCKET_SLOTS[group.bucket] * CARD_W + (BUCKET_SLOTS[group.bucket] - 1) * GAP;

  return (
    <>
      <div style={{ position: 'absolute', left: x, top: y, width, textAlign: 'center' }}>
        <div className="display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold-bright)' }}>
          {BUCKET_LABEL_PT_BR[group.bucket]}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{group.subtitle}</div>
        <GoldRule style={{ marginTop: 8 }} />
      </div>
      {teams.map((teamId, i) => (
        <TeamCard
          key={teamId}
          teamId={teamId}
          bucket={group.bucket}
          name={names.get(teamId) ?? teamId}
          x={x + i * (CARD_W + GAP)}
          y={y + 56}
        />
      ))}
    </>
  );
}

export function PredictionsScene() {
  const names = useMemo(() => {
    const data = loadDataset();
    return new Map([...data.teams].map(([id, t]) => [id, t.name]));
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

  let x = 60;
  const topPositions = TOP_ROW.map((g) => {
    const pos = x;
    x += BUCKET_SLOTS[g.bucket] * CARD_W + (BUCKET_SLOTS[g.bucket] - 1) * GAP + 46;
    return pos;
  });
  x = 60;
  const bottomPositions = BOTTOM_ROW.map((g) => {
    const pos = x;
    x += BUCKET_SLOTS[g.bucket] * CARD_W + (BUCKET_SLOTS[g.bucket] - 1) * GAP + 46;
    return pos;
  });

  return (
    <>
      <div style={{ position: 'absolute', top: 26, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="display" style={{ fontSize: 20, letterSpacing: '0.32em', color: 'var(--gold-dim)' }}>
          PALPITES &nbsp;·&nbsp; FASE DE GRUPOS
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>
          {swiss._meta.iterations.toLocaleString('pt-BR')} simulacoes do Suico
        </span>
      </div>

      {TOP_ROW.map((g, i) => (
        <BucketGroup key={g.bucket} group={g} teams={byBucket(g.bucket)} x={topPositions[i]} y={78} names={names} />
      ))}
      {BOTTOM_ROW.map((g, i) => (
        <BucketGroup key={g.bucket} group={g} teams={byBucket(g.bucket)} x={bottomPositions[i]} y={452} names={names} />
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
            <span className="numeral" style={{ fontSize: 32, color: 'var(--text-dim)' }}>de 16</span>
          </div>
          <div style={{ fontSize: 17, color: 'var(--text)', marginTop: 8, fontWeight: 600 }}>
            palpites FIRMES
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>
            nao mudam por mais que eu mexa no modelo
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
              contra <b className="numeral" style={{ color: 'var(--text)' }}>{randomBaseline.toFixed(1)}</b> no chute
            </span>
          </div>
          <div style={{ fontSize: 17, color: 'var(--text)', marginTop: 8, fontWeight: 600 }}>
            acertos esperados
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>
            {((expectedHits / randomBaseline - 1) * 100).toFixed(0)}% acima de sortear os 16 times nas vagas
          </div>
        </div>

        <div style={{ flex: 1, fontSize: 18, color: 'var(--text)', lineHeight: 1.5, alignSelf: 'center' }}>
          <b style={{ color: 'var(--gold-bright)' }}>Por que o teto e baixo:</b> dez dos 16 times caem na
          rodada eliminatoria, e ganhar ou perder la e quase cara-ou-coroa. Essas dez vagas nao rendem
          por mais que se calcule — nem pra mim, nem pra ninguem.
          <div style={{ marginTop: 9, fontSize: 16, color: 'var(--warn)' }}>
            O <b>4-0</b> e o <b>4-1</b> sao os mais fracos: mexendo na calibracao eles trocam de dono.
            Por isso vao marcados como CHUTE.
          </div>
        </div>
      </div>
    </>
  );
}
