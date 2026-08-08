import { useEffect, useMemo, useState } from 'react';
import swiss from '../../data/generated/swiss.json';
import { loadDataset } from '../../data/load';
import { BUCKET_ORDER, BUCKET_SLOTS } from '../../engine/swiss';
import type { Bucket } from '../../engine/swiss';
import { GoldRule } from '../../ui/primitives';
import { TeamLogo } from '../../ui/Portrait';
import { useLang } from '../../i18n/LangContext';
import { label } from '../../i18n/strings';
import { loadProPicks } from '../../data/proPicks';

const ourPicks = swiss.picks as Record<string, Bucket>;
const stability = swiss.stability as Record<string, number>;
const probability = swiss.bucketProbability as Record<string, Record<Bucket, number>>;

/** Mesma ordem de leitura da tela do cliente — o publico reconhece na hora. */
const TOP_ROW: readonly Bucket[] = ['4-0', '4-1', 'elimWin'];
const BOTTOM_ROW: readonly Bucket[] = ['elimLose', '1-4', '0-4'];

const CARD_W = 206;
const CARD_H = 248;
const GAP = 12;

/**
 * Ritmo vertical somado a mao, com as DUAS faixas de botao no topo:
 *   18   abas de cena + idioma (nivel do App)
 *   64   titulo + seletor de autor
 *  114   linha 1: 54 de cabecalho de balde + 248 de card = 302  -> 416
 *  432   linha 2                                                -> 734
 *  754   rodape, 180 de altura                                  -> 934
 */
const HEADER_H = 54;
const ROW1_Y = 114;
const ROW2_Y = ROW1_Y + HEADER_H + CARD_H + 30;
const FOOTER_Y = ROW2_Y + HEADER_H + CARD_H + 20;

/**
 * Um autor de palpite: nos, um profissional, ou "quem nao mexeu".
 *
 * A tela e uma APRESENTACAO: clica no nome e a grade inteira vira o palpite
 * daquela pessoa. Nao e sobreposicao de comparacao — e trocar de quadro, pra
 * poder dizer no ar "esse aqui e o do Claude, e esse aqui e o do Topson".
 */
interface Author {
  readonly id: string;
  readonly name: string;
  readonly source: string;
  readonly picks: Readonly<Record<string, Bucket>>;
  /** So o nosso tem selo de estabilidade — ele mede o NOSSO modelo, nao a pessoa. */
  readonly isModel: boolean;
}

function TeamCard({ teamId, bucket, name, x, y, author, ourBucket, overlay }: {
  readonly teamId: string; readonly bucket: Bucket; readonly name: string;
  readonly x: number; readonly y: number;
  readonly author: Author;
  readonly ourBucket: Bucket | undefined;
  readonly overlay: boolean;
}) {
  const { lang, t } = useLang();
  const p = probability[teamId]?.[bucket] ?? 0;

  const stable = author.isModel && stability[teamId] === swiss.maxStability;
  const shaky = author.isModel && stability[teamId] <= 1;
  const differs = overlay && !author.isModel && ourBucket !== undefined && ourBucket !== bucket;

  const accent = stable ? 'var(--ok)' : shaky || differs ? 'var(--warn)' : 'var(--gold-line)';

  return (
    <div
      className="panel"
      style={{
        position: 'absolute', left: x, top: y, width: CARD_W, height: CARD_H,
        padding: '14px 12px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', alignItems: 'center', textAlign: 'center',
        borderColor: stable || differs ? accent : 'var(--gold-line)',
        borderWidth: stable || differs ? 2 : 1,
        background: stable
          ? 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)'
          : 'linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-mid) 100%)',
      }}
    >
      {author.isModel ? (
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
      ) : differs && ourBucket ? (
        // So marca a DISCORDANCIA. Carimbar "igual ao nosso" em 12 dos 16 cards
        // era poluicao — o olho tem que ir direto pro que e diferente.
        <div
          style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', padding: '4px 9px', borderRadius: 2,
            maxWidth: CARD_W - 24, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            background: 'var(--warn)', border: '1px solid var(--warn)', color: '#1b1006',
          }}
        >
          {t.weSay}: {label.bucketShort(ourBucket, lang)}
        </div>
      ) : (
        <div style={{ height: 24 }} />
      )}

      <TeamLogo teamId={teamId} size={70} />

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 1.1 }}>
        {name}
      </div>

      <div className="numeral" style={{ fontSize: 34, color: 'var(--text)', lineHeight: 0.9 }}>
        {(p * 100).toFixed(0)}<span style={{ fontSize: 18, color: 'var(--text-dim)' }}>%</span>
      </div>
    </div>
  );
}

function BucketGroup({ bucket, teams, x, y, names, author, overlay }: {
  readonly bucket: Bucket; readonly teams: readonly string[];
  readonly x: number; readonly y: number; readonly names: ReadonlyMap<string, string>;
  readonly author: Author; readonly overlay: boolean;
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
          y={y + HEADER_H}
          author={author}
          ourBucket={ourPicks[teamId]}
          overlay={overlay}
        />
      ))}
    </>
  );
}

function buildAuthors(t: ReturnType<typeof useLang>['t']): readonly Author[] {
  return [
    { id: 'model', name: t.ourModelName, source: t.modelSource, picks: ourPicks, isModel: true },
    ...loadProPicks().map((pro) => ({
      id: pro.id, name: pro.name, source: pro.source, picks: pro.picks, isModel: false,
    })),
  ];
}

export function PredictionsScene() {
  const { lang, t } = useLang();
  const names = useMemo(() => {
    const data = loadDataset();
    return new Map([...data.teams].map(([id, team]) => [id, team.name]));
  }, []);

  const authors = useMemo(() => buildAuthors(t), [t]);
  const [authorIndex, setAuthorIndex] = useState(0);
  /** Sobreposicao de comparacao: marca onde o autor discorda de nos. */
  const [overlay, setOverlay] = useState(true);
  const author = authors[Math.min(authorIndex, authors.length - 1)];

  // Numeros 3, 4, 5... trocam de autor; C liga/desliga a comparacao.
  // Na live, mouse na tela e sujeira.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 3 && n - 3 < authors.length) setAuthorIndex(n - 3);
      if (e.key.toLowerCase() === 'c') setOverlay((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authors.length]);

  const byBucket = (bucket: Bucket) =>
    Object.keys(author.picks).filter((id) => author.picks[id] === bucket);

  const expectedHits = Object.entries(author.picks)
    .reduce((acc, [id, bucket]) => acc + (probability[id]?.[bucket] ?? 0), 0);
  const ourHits = Object.entries(ourPicks)
    .reduce((acc, [id, bucket]) => acc + (probability[id]?.[bucket] ?? 0), 0);
  const firm = Object.values(stability).filter((s) => s === swiss.maxStability).length;
  const agreements = Object.entries(author.picks)
    .filter(([id, b]) => ourPicks[id] === b).length;

  /**
   * As discordancias, com a probabilidade que o NOSSO modelo da a cada lado.
   *
   * Ordenadas pelo tamanho da divergencia, nao por nome: numa live so da tempo
   * de falar das duas ou tres que decidem, e sao essas que explicam o placar.
   */
  const disagreements = Object.entries(author.picks)
    .flatMap(([teamId, theirBucket]) => {
      const ourBucket = ourPicks[teamId];
      if (ourBucket === undefined || ourBucket === theirBucket) return [];
      return [{
        teamId,
        theirBucket,
        ourBucket,
        theirs: probability[teamId]?.[theirBucket] ?? 0,
        ours: probability[teamId]?.[ourBucket] ?? 0,
      }];
    })
    .sort((a, b) => Math.abs(b.ours - b.theirs) - Math.abs(a.ours - a.theirs));

  /**
   * Quanto acerta quem sorteia os 16 times nas 16 vagas: soma de vagas^2 / 16 =
   * (1+4+25+25+4+1)/16 = 3,75. Sem essa regua, "5,1 de 16" parece derrota.
   */
  const randomBaseline = BUCKET_ORDER.reduce((acc, b) => acc + BUCKET_SLOTS[b] ** 2, 0) / 16;

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
      {/* Linha 2: seletor de autor. As abas de cena e idioma ficam em y=18. */}
      <span
        className="display"
        style={{ position: 'absolute', top: 64, left: 60, fontSize: 19, letterSpacing: '0.18em', color: 'var(--gold-bright)', lineHeight: '38px' }}
      >
        {t.predictionsTitle} &nbsp;·&nbsp; {t.groupStage}
      </span>

      {/*
        O SELETOR DE AUTOR: o coracao da apresentacao, entao vai no MEIO da tela.
        Com `space-between` e so dois filhos ele era empurrado pro canto direito.

        Centralizado por `left/right: 0` + `justifyContent: center`, NAO por
        `left: 50%` + translate: naquele jeito a caixa so pode ocupar da metade
        da tela pra direita (960px), e com cinco autores MAIS o botao COMPARAR a
        fileira passa de 1000px e quebra em duas linhas. Ela so quebraria ao
        escolher um autor que nao o modelo, entao a tela parecia inteira ate
        alguem clicar no ar. `pointerEvents` volta a existir so nos botoes, pra
        faixa invisivel nao cobrir o titulo ao lado.
      */}
      <div style={{ position: 'absolute', top: 64, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 5, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, pointerEvents: 'auto', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--text-dim)' }}>{t.whosePicks}</span>
          {authors.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAuthorIndex(i)}
              style={{
                font: 'inherit', cursor: 'pointer', fontSize: 15, letterSpacing: '0.06em',
                padding: '8px 18px', borderRadius: 3,
                border: `2px solid ${author.id === a.id ? 'var(--gold-bright)' : 'var(--gold-line)'}`,
                color: author.id === a.id ? 'var(--bg-deep)' : 'var(--gold)',
                background: author.id === a.id ? 'var(--gold-bright)' : 'rgba(0,0,0,0.30)',
                fontWeight: author.id === a.id ? 700 : 500,
              }}
            >
              {i + 3} · {a.name.toUpperCase()}
            </button>
          ))}

          {/*
            SEMPRE renderizado, mesmo sem servir.
            Ele aparecia so em autor nao-modelo, e como a fileira e centralizada,
            surgir um botao de 140px empurrava os outros cinco pro lado no meio
            da apresentacao. Botao que entra e sai muda o layout dos vizinhos;
            botao desabilitado nao muda nada e ainda ensina o que ele faz.
          */}
          <button
            type="button"
            disabled={author.isModel}
            title={author.isModel ? t.compareNeedsAuthor : undefined}
            onClick={() => setOverlay((v) => !v)}
            style={{
              font: 'inherit', fontSize: 14, letterSpacing: '0.06em',
              padding: '8px 14px', borderRadius: 3, marginLeft: 6,
              cursor: author.isModel ? 'not-allowed' : 'pointer',
              opacity: author.isModel ? 0.35 : 1,
              border: `2px solid ${overlay && !author.isModel ? 'var(--warn)' : 'var(--gold-line)'}`,
              color: overlay && !author.isModel ? '#1b1006' : 'var(--gold)',
              background: overlay && !author.isModel ? 'var(--warn)' : 'rgba(0,0,0,0.30)',
              fontWeight: overlay && !author.isModel ? 700 : 500,
            }}
          >
            C · {lang === 'pt' ? 'COMPARAR' : 'COMPARE'}
          </button>
        </div>
      </div>

      {TOP_ROW.map((b, i) => (
        <BucketGroup key={b} bucket={b} teams={byBucket(b)} x={topPositions[i]} y={ROW1_Y} names={names} author={author} overlay={overlay} />
      ))}
      {BOTTOM_ROW.map((b, i) => (
        <BucketGroup key={b} bucket={b} teams={byBucket(b)} x={bottomPositions[i]} y={ROW2_Y} names={names} author={author} overlay={overlay} />
      ))}

      <div
        className="panel"
        style={{
          position: 'absolute', left: 60, top: FOOTER_Y, width: 1800, height: 180, padding: '18px 28px',
          display: 'flex', gap: 24, alignItems: 'stretch',
          background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
        }}
      >
        <div
          style={{
            width: 330, borderRadius: 3, border: '2px solid var(--gold-bright)',
            background: 'rgba(224,184,106,0.12)', padding: '12px 20px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--gold)' }}>{t.whosePicks}</div>
          <div className="display" style={{ fontSize: 34, color: 'var(--gold-bright)', lineHeight: 1.05, marginTop: 4 }}>
            {author.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.35 }}>
            {author.source}
          </div>
        </div>

        <div
          style={{
            width: 330, borderRadius: 3, border: '1px solid var(--gold-line)',
            background: 'rgba(0,0,0,0.22)', padding: '12px 20px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="numeral" style={{ fontSize: 58, color: 'var(--gold-bright)', lineHeight: 0.85 }}>
              {expectedHits.toFixed(1)}
            </span>
            <span style={{ fontSize: 20, color: 'var(--text-dim)' }}>
              {t.vsRandom(randomBaseline.toFixed(1))}
            </span>
          </div>
          <div style={{ fontSize: 16, color: 'var(--text)', marginTop: 7, fontWeight: 600 }}>{t.expectedHits}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>
            {author.isModel
              ? `${firm} ${t.outOf16} ${t.firmPicks}`
              : t.agreesWithUs(agreements)}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, fontSize: 17, color: 'var(--text)', lineHeight: 1.45, alignSelf: 'center' }}>
          {author.isModel && (
            <>
              <b style={{ color: 'var(--gold-bright)' }}>{t.ceilingLead}</b> {t.ceilingBody}
              <div style={{ marginTop: 8, fontSize: 15, color: 'var(--warn)' }}>
                <b>4-0</b> / <b>4-1</b> {t.weakestLead} {t.weakestBody}
              </div>
            </>
          )}

          {!author.isModel && !overlay && (
            <>
              <b style={{ color: 'var(--gold-bright)' }}>{author.name}</b>{' '}
              {t.scoresAgainst(expectedHits.toFixed(1), ourHits.toFixed(1))}
              <div style={{ marginTop: 8, fontSize: 15, color: 'var(--text-dim)' }}>
                {t.comparePrompt}
              </div>
            </>
          )}

          {/*
            O COMPARE de verdade: nao basta pintar o card de amarelo. A pergunta
            que se faz no ar e "e quem esta certo?" — entao cada discordancia
            mostra os DOIS palpites com a probabilidade que o modelo da a cada um.
            A soma dessas diferencas E a diferenca de acertos esperados dos dois,
            entao o rodape para de ser opiniao e vira a conta aberta.
          */}
          {!author.isModel && overlay && (
            <div>
              {/* A contagem de iguais ja esta no card do meio — aqui seria eco. */}
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--warn)', marginBottom: 7 }}>
                {t.compareTitle}
              </div>

              {disagreements.length === 0 ? (
                <div style={{ fontSize: 16, color: 'var(--text-dim)' }}>{t.compareNone}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {disagreements.slice(0, 4).map((d) => (
                    <div key={d.teamId} style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 15, whiteSpace: 'nowrap' }}>
                      <span style={{ width: 168, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--gold-bright)', fontWeight: 600 }}>
                        {names.get(d.teamId) ?? d.teamId}
                      </span>
                      <span style={{ color: d.theirs > d.ours ? '#8fd46e' : 'var(--text-dim)' }}>
                        {author.name}: <b>{label.bucketShort(d.theirBucket, lang)}</b>{' '}
                        <span className="numeral">{(d.theirs * 100).toFixed(0)}%</span>
                      </span>
                      <span style={{ color: 'var(--text-faint)' }}>·</span>
                      <span style={{ color: d.ours > d.theirs ? '#8fd46e' : 'var(--text-dim)' }}>
                        {t.weSay}: <b>{label.bucketShort(d.ourBucket, lang)}</b>{' '}
                        <span className="numeral">{(d.ours * 100).toFixed(0)}%</span>
                      </span>
                    </div>
                  ))}
                  {disagreements.length > 4 && (
                    <div style={{ fontSize: 14, color: 'var(--text-faint)' }}>
                      {t.compareMore(disagreements.length - 4)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
