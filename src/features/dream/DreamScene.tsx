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
 * DUAS faixas de botao no topo, como na tela de Palpites:
 *   18   abas de cena + idioma (nivel do App, centralizadas)
 *   64   titulo + seletor de autor
 *  108   os cards
 *
 * O card mais alto e o do MEIO: retrato solo maior e TRES cores de emblema
 * contra duas das outras funcoes.
 *   20 padding + 30 rotulo + 26 regua + 60 logo/nome + 180 retrato
 *   + 47 rotulo + 154 tres caixas + 106 alvo de renovacao + 20 padding = 643
 * 654 deixa folga.
 *
 * Ja vazou DUAS vezes aqui, sempre pelo mesmo motivo: eu somei a altura antes de
 * adicionar a ultima caixa. Da segunda vez o retrato solo estava em 156 e a caixa
 * de alvo tinha crescido — o Meio cortava o "dois ou mais REPETIDOS". Se mexer em
 * qualquer linha desta conta, some de novo.
 */
const CARD_Y = 108;
const CARD_H = 654;
const BAND_Y = CARD_Y + CARD_H + 14;
const BAND_H = 160;
const RULES_Y = BAND_Y + BAND_H + 12;
const RULES_H = 92;

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
  slot, ranking, data, x, y, w, teamId,
}: {
  readonly slot: RoleSlot;
  readonly ranking: RoleRanking;
  readonly data: LoadedData;
  readonly x: number; readonly y: number; readonly w: number;
  /** Time do autor selecionado. Ausente = o lider do nosso modelo. */
  readonly teamId?: string;
}) {
  const { lang, t } = useLang();
  const leader = (teamId ? ranking.teams.find((tm) => tm.teamId === teamId) : undefined) ?? ranking.teams[0];
  const team = data.teams.get(leader.teamId);
  const unit = data.roleUnits.get(`${leader.teamId}:${slot}`);
  const roster = (unit?.playerIds ?? []).map((id) => ({ id, nick: data.players.get(id)?.nick ?? id }));
  const portraitSize = roster.length > 1 ? 128 : 140;

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
                  {keep.map((k) => label.statShort(k.statId, lang)).join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/*
        Nivel e traco alvo. Vem por busca exaustiva nos 216 arranjos, nao por
        argumento — e o triplo Amigavel ganha nas tres funcoes, porque as tres
        stats de um estandarte real tem valor parecido e o bonus PLANO bate a
        concentracao. Fica claro que e ALVO: traco vem sorteado, nao se escolhe.
      */}
      <div style={{ marginTop: 'auto', paddingTop: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 6 }}>
          {t.rerollAnythingElse}
        </div>
        <div
          style={{
            padding: '8px 12px', borderRadius: 2,
            border: '1px solid var(--gold-line)', background: 'rgba(0,0,0,0.22)',
            fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.4,
          }}
        >
          {/*
            A regra CONDICIONAL. Qualidade vem sorteada, entao nao existe "o
            estandarte otimo" — existe o otimo DADO O QUE CAIU. E a resposta
            vira, porque Fractal exige as tres qualidades diferentes.
          */}
          <div style={{ color: 'var(--gold)', marginBottom: 4 }}>{t.traitTargetLead}</div>
          <div>
            {t.tiersDistinct}{' '}
            <b style={{ color: 'var(--text)' }}>
              {leader.traitPlan.whenDistinct.map((tr) => label.trait(tr, lang)).join(' + ')}
            </b>
          </div>
          <div>
            {t.tiersRepeated}{' '}
            <b style={{ color: 'var(--text)' }}>
              {leader.traitPlan.whenRepeated.map((tr) => label.trait(tr, lang)).join(' + ')}
            </b>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DreamScene() {
  const { data, teamRanking, recommendedTitle, dreamAuthors } = useEngine();
  const countdown = useCountdown();
  const { lang, t } = useLang();

  /** Autor selecionado. null = o modelo (nossa escalacao calculada). */
  const [authorId, setAuthorId] = useState<string | null>(null);
  const author = dreamAuthors.find((a) => a.id === authorId) ?? null;

  // Teclas 3, 4, 5... trocam de autor; 0 volta pro modelo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '0') setAuthorId(null);
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 3 && n - 3 < dreamAuthors.length) {
        setAuthorId(dreamAuthors[n - 3].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dreamAuthors]);

  const shownTitle = author ? author.title : recommendedTitle;
  const prefix = shownTitle?.prefix ? PREFIX_DEFINITIONS[shownTitle.prefix] : null;
  const suffix = shownTitle?.suffix ? SUFFIX_DEFINITIONS[shownTitle.suffix] : null;

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
      {/*
        Linha 2. As abas de cena e idioma vivem no nivel do App, centralizadas em
        y=18 — pela SEGUNDA vez eu pus outra fileira de botao na mesma faixa e
        eles se cobriram. Aqui embaixo nao ha colisao possivel.
      */}
      <span className="display" style={{ position: 'absolute', top: 64, left: 60, fontSize: 19, letterSpacing: '0.18em', color: 'var(--gold-bright)', lineHeight: '38px' }}>
        {t.dreamTitle}
      </span>
      <span style={{ position: 'absolute', top: 64, right: 60, fontSize: 14, letterSpacing: '0.1em', color: 'var(--text-dim)', whiteSpace: 'nowrap', lineHeight: '38px' }}>
        {t.locksIn} <span className="numeral" style={{ color: 'var(--warn)', fontSize: 22, letterSpacing: 0 }}>{countdown}</span>
      </span>

      {/*
        Seletor de autor CENTRALIZADO, igual ao da tela de Palpites — e pelo
        mesmo jeito: `left/right: 0` + `justifyContent: center`. Com `left: 50%`
        a fileira so podia ocupar 960px, e cada autor novo aproxima a quebra.
      */}
      <div style={{ position: 'absolute', top: 64, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 5, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 12, letterSpacing: '0.12em', color: 'var(--text-dim)' }}>{t.whosePicks}</span>
          {[{ id: null, name: t.ourModelName }, ...dreamAuthors.map((a) => ({ id: a.id, name: a.name }))]
            .map((a, i) => (
              <button
                key={a.id ?? 'model'}
                type="button"
                onClick={() => setAuthorId(a.id)}
                style={{
                  font: 'inherit', cursor: 'pointer', fontSize: 14, letterSpacing: '0.05em',
                  padding: '7px 16px', borderRadius: 3,
                  border: `2px solid ${authorId === a.id ? 'var(--gold-bright)' : 'var(--gold-line)'}`,
                  color: authorId === a.id ? 'var(--bg-deep)' : 'var(--gold)',
                  background: authorId === a.id ? 'var(--gold-bright)' : 'rgba(0,0,0,0.30)',
                  fontWeight: authorId === a.id ? 700 : 500,
                }}
              >
                {i === 0 ? '0' : i + 2} · {a.name.toUpperCase()}
              </button>
            ))}
        </div>
      </div>

      {/* PRINCIPAL, MEIO, SUPORTE — na ordem do cliente, pra bater com o que a pessoa ve la */}
      <RoleCard slot="core" ranking={teamRanking.core} data={data} x={60} y={CARD_Y} w={588} teamId={author?.teams.core} />
      <RoleCard slot="mid" ranking={teamRanking.mid} data={data} x={666} y={CARD_Y} w={588} teamId={author?.teams.mid} />
      <RoleCard slot="support" ranking={teamRanking.support} data={data} x={1272} y={CARD_Y} w={588} teamId={author?.teams.support} />

      {/* TREINADOR */}
      <div
        className="panel"
        style={{
          position: 'absolute', left: 60, top: BAND_Y, width: 1194, height: BAND_H, padding: '20px 28px',
          background: 'linear-gradient(180deg, var(--bg-panel-hi) 0%, var(--bg-panel) 100%)',
        }}
      >
        <div style={{ fontSize: 14, letterSpacing: '0.14em', color: 'var(--gold)' }}>{t.coachTitle}</div>
        {/*
          O titulo do AUTOR selecionado, nao o nosso.
          Antes o nome grande vinha de `recommendedTitle` e as duas condicoes
          embaixo vinham do autor — entao escolher o Desleal Dota mostrava o
          nosso titulo com os bonus dele. Como as duas fontes quase sempre
          coincidiam no prefixo, dava pra olhar a tela e nao ver.
        */}
        <div className="display" style={{ fontSize: 56, color: 'var(--gold-bright)', marginTop: 10, lineHeight: 1 }}>
          {label.coachTitle(shownTitle?.prefix ?? null, shownTitle?.suffix ?? null, lang)}
        </div>
        <div style={{ display: 'flex', gap: 44, marginTop: 16, fontSize: 19, color: 'var(--text)' }}>
          {prefix && shownTitle?.prefix && (
            <span>
              <b style={{ color: 'var(--gold-bright)' }}>+{Math.round(prefix.bonus * 100)}%</b>{' '}
              {label.prefixCondition(shownTitle.prefix, lang)}
            </span>
          )}
          {suffix && shownTitle?.suffix && (
            <span>
              <b style={{ color: 'var(--gold-bright)' }}>+{Math.round(suffix.bonus * 100)}%</b>{' '}
              {label.suffixCondition(shownTitle.suffix, lang)}
            </span>
          )}
          {!shownTitle?.prefix && !shownTitle?.suffix && (
            <span style={{ color: 'var(--text-dim)' }}>{t.noTitleChosen}</span>
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
        <div className="display" style={{ fontSize: 38, color: 'var(--gold-bright)', marginTop: 8, lineHeight: 1 }}>
          {t.spendOn} {label.role(bestReroll, lang)}
        </div>
        <div style={{ marginTop: 9, fontSize: 16, color: 'var(--gold)', fontWeight: 600 }}>
          {t.tokensYield((teamRanking[bestReroll].rerollPayoff * 100).toFixed(0))}
        </div>
        {/*
          O MOTIVO. Sem ele o card dizia "gaste no Meio" e ninguem — nem o Kamus —
          entendia por que. Ficha rende onde a SORTE PESA, e no azul do Meio ela
          pesa mais do que em qualquer outro lugar do torneio.
        */}
        {sharpest && (
          <div style={{ marginTop: 9, fontSize: 14, color: 'var(--text)', lineHeight: 1.4 }}>
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
