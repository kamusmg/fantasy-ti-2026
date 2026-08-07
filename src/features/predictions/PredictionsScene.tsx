import swiss from '../../data/generated/swiss.json';
import { loadDataset } from '../../data/load';
import { BUCKET_LABEL_PT_BR, BUCKET_SLOTS } from '../../engine/swiss';
import type { Bucket } from '../../engine/swiss';
import { GoldRule } from '../../ui/primitives';
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
const CARD_H = 244;
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

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 1.12 }}>
        {name}
      </div>

      <div className="numeral" style={{ fontSize: 46, color: 'var(--text)', lineHeight: 0.9 }}>
        {(p * 100).toFixed(0)}<span style={{ fontSize: 22, color: 'var(--text-dim)' }}>%</span>
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

      {/* rodape de honestidade — o valor aqui e admitir o que e chute */}
      <div className="panel" style={{ position: 'absolute', left: 60, top: 826, width: 1800, height: 172, padding: '20px 28px' }}>
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'center', minWidth: 190 }}>
            <div className="numeral" style={{ fontSize: 64, color: 'var(--gold-bright)', lineHeight: 0.9 }}>
              {expectedHits.toFixed(1)}
            </div>
            <div style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--text-faint)', marginTop: 4 }}>
              ACERTOS ESPERADOS DE 16
            </div>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--gold-line)' }} />
          <div style={{ textAlign: 'center', minWidth: 190 }}>
            <div className="numeral" style={{ fontSize: 64, color: 'var(--ok)', lineHeight: 0.9 }}>
              {firm}
            </div>
            <div style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--text-faint)', marginTop: 4 }}>
              PALPITES FIRMES
            </div>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--gold-line)' }} />
          <div style={{ flex: 1, fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            Cinco de 16 nao e o modelo sendo ruim — e o formato. <b style={{ color: 'var(--text)' }}>Dez dos
            16 times caem na rodada eliminatoria</b>, e vencer ou perder la e quase cara-ou-coroa, entao
            esses dez baldes valem pouco por mais que se calcule.
            <br />
            <span style={{ color: 'var(--warn)' }}>
              O 4-0 e o 4-1 sao os menos confiaveis: mudando a calibracao da simulacao eles trocam de dono.
            </span>{' '}
            <b style={{ color: 'var(--ok)' }}>FIRME</b> = o palpite aguenta as cinco calibracoes testadas.
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-faint)' }}>
          forca de time pelas odds do Polymarket (precificam o ELENCO que vai jogar, nao o historico da organizacao)
          &nbsp;·&nbsp; atribuicao otima por algoritmo hungaro &nbsp;·&nbsp; semente fixa, mesmo resultado toda vez
        </div>
      </div>
    </>
  );
}
