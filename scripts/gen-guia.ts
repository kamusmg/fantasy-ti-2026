/**
 * Gera o GUIA_ATRIBUTOS_2026.md a partir do MOTOR.
 *
 * O arquivo antigo era escrito a mao, e envelheceu errado: faltavam 9 dos 18
 * atributos, seis posicoes estavam invertidas em relacao ao que o motor mede, e
 * os nomes eram jargao ("Pedras Loucas", "Abates", "Stacks") em vez do que o
 * jogo escreve. Como ele circulou como referencia, o erro se espalhou.
 *
 * A licao nao e "eu errei a tabela": e que documento de referencia escrito a mao
 * ao lado de um motor que calcula a mesma coisa vira uma SEGUNDA fonte de
 * verdade, e as duas divergem em silencio. Agora ele e gerado, entao so pode
 * divergir se o motor divergir de si mesmo.
 *
 *   npx vite-node scripts/gen-guia.ts
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDataset } from '../src/data/load';
import { buildContext } from '../src/engine/context';
import { evaluateRoleCandidates } from '../src/engine/optimize';
import { rankTeams } from '../src/engine/teamRanking';
import { ALL_ROLE_SLOTS, BANNER_LAYOUT, ROLE_LABEL_PT_BR } from '../src/domain/roles';
import type { RoleSlot } from '../src/domain/roles';
import { COLOR_LABEL_PT_BR, STAT_DEFINITIONS } from '../src/domain/stats';
import type { StatId } from '../src/domain/stats';
import { leagueTargets, tieCount } from '../src/engine/rerollTargets';
import type { ColorTargets, RerollTarget } from '../src/engine/rerollTargets';
import teamStrengthRaw from '../src/data/raw/teamStrength.json';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MARKET = teamStrengthRaw.polymarketTitleProbability as unknown as Record<string, number>;

const data = loadDataset();
const ctx = buildContext(data);
const ranking = rankTeams(evaluateRoleCandidates(ctx), data.roleUnits, ctx.period, MARKET);

const VERDICT_WORD = { guardar: 'Top', aceitavel: 'Médio', rerolar: 'Ruim' } as const;

/** Nome do glossario de pontuacao e nome da plaquinha do emblema — os dois sao do cliente. */
function names(statId: StatId): { readonly full: string; readonly chip: string } {
  const def = STAT_DEFINITIONS[statId];
  return { full: def.labelPtBr, chip: def.shortPtBr };
}

function pct(target: RerollTarget): string {
  return `${Math.round(target.shareOfBest * 100)}%`;
}

/** A linha no formato da tabela antiga: "Top: A, B · Médio: C · Ruim: D". */
function tiersLine(targets: readonly RerollTarget[]): string {
  const buckets = (['guardar', 'aceitavel', 'rerolar'] as const).map((verdict) => {
    const names_ = targets
      .filter((t) => t.verdict === verdict)
      .map((t) => names(t.statId).full);
    return names_.length > 0 ? `**${VERDICT_WORD[verdict]}:** ${names_.join(', ')}` : null;
  });
  return buckets.filter(Boolean).join(' · ');
}

const lines: string[] = [];
const out = (s = '') => lines.push(s);

out('# Guia Fantasy — Função + Ranking de Atributos (TI 2026)');
out();
out('> **ARQUIVO GERADO — não edite à mão.** `npx vite-node scripts/gen-guia.ts`');
out('>');
out('> Os números saem do mesmo motor que a tela `#guia` do site, então guia e site');
out('> não têm como divergir. A versão anterior deste arquivo era escrita à mão e');
out('> divergia: faltavam 9 dos 18 atributos e seis posições estavam invertidas.');
out();
out(`Período: **Fase de Grupos**. Medido na equipe líder de cada função — no site dá pra`);
out('trocar a equipe e ver o ranking dela.');
out();
out('## Como ler');
out();
out('**Top / Médio / Ruim** são o veredito do motor, em fração do valor do MELHOR atributo');
out('daquela cor: **Top ≥ 90%** (guarde), **Médio ≥ 72%** (aceitável), abaixo disso **renove**.');
out('Os cortes são regra de bolso, não medida: ninguém publica a distribuição de resultado');
out('de um reroll. O que os sustenta é que, com 6 atributos por cor e o reroll garantindo');
out('atributo NOVO, trocar troca pela média dos outros cinco — se o que você tem já está');
out('acima dessa média, trocar tem valor esperado negativo.');
out();
out('**valor/mapa** é a estimativa de pontos de fantasy por mapa daquele atributo, para os');
out('jogadores daquela função naquela equipe. É por isso que a mesma stat vale coisas');
out('diferentes em funções diferentes.');
out();
out('Os nomes vêm da localização oficial da Valve. O cliente usa **duas grafias**: uma no');
out('glossário de pontuação e outra, mais curta, na plaquinha do emblema — as duas estão');
out('aqui, porque é a da plaquinha que você lê na hora de decidir o reroll.');
out();
out('## O encaixe do estandarte (Fase de Grupos)');
out();
for (const slot of ALL_ROLE_SLOTS) {
  const colors = BANNER_LAYOUT[slot].groupStage.map((c) => COLOR_LABEL_PT_BR[c]);
  out(`- **${ROLE_LABEL_PT_BR[slot].toUpperCase()}:** ${colors.join(' / ')}`);
}
out();
out('A cor vem **travada pela função** — você não escolhe. O Principal não tem emblema azul');
out('e o Suporte não tem emblema vermelho, então atributo daquela cor simplesmente não pode');
out('cair no estandarte deles.');
out();

function section(slot: RoleSlot, subtitle: string, colors: readonly ColorTargets[]) {
  out('---');
  out();
  out(`## ${ROLE_LABEL_PT_BR[slot].toUpperCase()}`);
  out();
  out(subtitle);
  out();

  for (const color of colors) {
    out(`### ${COLOR_LABEL_PT_BR[color.color]} ×${color.emblemCount}`);
    out();
    out(tiersLine(color.targets));
    out();
    const tied = tieCount(color);
    if (tied > 0) {
      out(`> **Empate técnico entre os ${tied} primeiros.** A diferença entre eles é menor que o erro`);
      out('> do próprio modelo — ali não existe "o melhor", fique com o que caiu.');
      out();
    }
    out('| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |');
    out('|---|---|---|---|---|---|');
    color.targets.forEach((t, i) => {
      const n = names(t.statId);
      const mark = i < tied ? ' =' : '';
      out(`| ${i + 1}${mark} | ${n.full} | ${n.chip} | ${t.value.toFixed(0)} | ${pct(t)} | ${VERDICT_WORD[t.verdict]} |`);
    });
    out();
  }

  /**
   * Ranking geral da funcao: todas as cores juntas, em ordem de valor.
   *
   * Serve pra saber o que da mais alegria ver cair, NAO pra decidir troca — a cor
   * do emblema e fixa, entao nao existe trocar um vermelho por um verde.
   */
  const all = colors
    .flatMap((c) => c.targets.map((t) => ({ ...t, color: c.color })))
    .sort((a, b) => b.value - a.value);

  out('### Ranking geral da função');
  out();
  out('Todas as cores do estandarte juntas, em ordem de valor por mapa. **Não é uma lista de');
  out('escolha:** a cor de cada emblema é fixa, então não existe trocar um vermelho por um');
  out('verde. Serve pra saber o que dá mais alegria ver cair.');
  out();
  out('| # | Atributo | Cor | valor/mapa |');
  out('|---|---|---|---|');
  all.forEach((t, i) => {
    out(`| ${i + 1} | ${names(t.statId).full} | ${COLOR_LABEL_PT_BR[t.color]} | ${t.value.toFixed(0)} |`);
  });
  out();
}

out('# Parte 1 — A REGRA GERAL (média da liga)');
out();
out('**É por aqui que se começa.** São 2.888 replays de 14 ligas, sem equipe nenhuma no meio.');
out('Foi o que a versão escrita à mão tentava dizer, e é o que o site agora mostra por padrão.');
out();
for (const slot of ALL_ROLE_SLOTS) {
  section(slot, 'Média da liga — **2.888 replays de 14 ligas**, sem equipe nenhuma.',
    leagueTargets(slot, 'groupStage', data.leagueMean));
}

out('# Parte 2 — O CASO DE CADA EQUIPE RECOMENDADA');
out();
out('Os mesmos atributos, medidos na equipe que o motor recomenda para cada função. **Isto é');
out('um caso, não a regra** — e a diferença importa: no azul do Suporte, a LGD é uma das DUAS');
out('equipes (de 16) em que Vigias Ativados passa Sentinelas Posicionadas. Ler o caso como se');
out('fosse a regra é exatamente o erro que este arquivo já cometeu.');
out();
for (const slot of ALL_ROLE_SLOTS) {
  const leader = ranking[slot].teams[0];
  const team = data.teams.get(leader.teamId);
  const unit = data.roleUnits.get(`${leader.teamId}:${slot}`);
  const roster = (unit?.playerIds ?? []).map((id) => data.players.get(id)?.nick ?? id);
  section(slot, `Medido em **${team?.name ?? leader.teamId}** — ${roster.join(' e ')}.`, leader.rerollTargets);
}

out('---');
out();
out('## O que a versão escrita à mão errava');
out();
out('Guardado aqui de propósito: a tabela antiga circulou como referência, e quem a viu');
out('precisa saber o que trocar de ideia.');
out();
out('| onde | a tabela dizia | o motor mede |');
out('|---|---|---|');
out('| Suporte, azul | listava "Lascas" | Lascas é **vermelho** — não existe nesse estandarte |');
out('| Meio, vermelho | Vítimas Top, Mortes Médio | **Mortes** vale mais que **Vítimas** |');
out('| Meio, azul | Acampamentos Ruim, Vigias Médio | **Acampamentos** vale mais que **Vigias** |');
out('| Meio, azul | não citava Fumaças | é o **piso** da cor |');
out('| Principal, vermelho | Lascas Ruim, Torres Médio | **Lascas** vale mais que **Torres** |');
out('| Suporte, verde | não citava Entregadores | é o **segundo** da cor |');
out('| geral | "Ruim: RNG" | RNG não é atributo |');
out();
out('### E o que EU errei ao corrigi-la');
out();
out('Numa versão anterior deste arquivo eu escrevi que a tabela errava por **não citar Vigias');
out('Ativados como o melhor azul do Suporte**. Isso está errado, e o erro é meu: eu li o número');
out('da LGD — a equipe recomendada, e portanto a que a tela abria — e o apresentei como fato da');
out('liga. Na média das 14 ligas o melhor azul do Suporte é **Sentinelas Posicionadas**, e');
out('Vigias lidera em apenas **2 das 16** equipes. A tabela escrita à mão estava CERTA nesse');
out('ponto.');
out();
out('A causa não era o cálculo: era a tela abrir travada numa equipe. Por isso o padrão do');
out('seletor virou a média da liga, e a lista de equipes virou ordem alfabética, sem estrela.');
out('**Lei: quando a tela abre num caso, ela ensina o caso como se fosse a regra.**');
out();
out('Nomes trocados: *Pedras Loucas* → **Lascas de Insanite**, *Abates* → **Vítimas**,');
out('*Poucas Mortes* → **Mortes**, *Stacks* → **Acampamentos Acumulados**,');
out('*Smoke of Deceit* → **Fumaças Usadas**, *Sentinelas (Wards Placed)* → na plaquinha');
out('do emblema é **Sent. Obs.**');
out();

writeFileSync(join(ROOT, 'GUIA_ATRIBUTOS_2026.md'), `${lines.join('\n')}\n`, 'utf8');
console.log('GUIA_ATRIBUTOS_2026.md gerado a partir do motor.');
