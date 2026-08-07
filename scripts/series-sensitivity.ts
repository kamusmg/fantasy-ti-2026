/**
 * A COLA MUDA SE O TIME JOGAR MENOS SERIES?
 *
 * So conta a MELHOR serie do periodo, entao jogar mais series e sorteio a mais.
 * Um time que faz 4-0 joga 4; quem cai na eliminatoria joga 6. Se o time
 * recomendado for favorito, ele joga MENOS e a vantagem dele encolhe.
 *
 * Em vez de inventar rating de time pra prever quem faz 4-0, a pergunta certa e
 * mais barata: a RECOMENDACAO muda entre 4, 5 e 6 series? Se o mesmo time vence
 * nos tres casos, o Suico nao muda a cola e da pra dizer isso com seguranca. Se
 * mudar, ai sim vale caçar rating de verdade.
 *
 * O teste e conservador de proposito: o time recomendado joga o MINIMO (4, como
 * se fosse atropelar o grupo) enquanto TODOS os rivais jogam o MAXIMO (6). E o
 * pior cenario possivel pra recomendacao.
 */
import { loadDataset } from '../src/data/load';
import { buildContext } from '../src/engine/context';
import { evaluateRoleCandidates } from '../src/engine/optimize';
import { rankTeams } from '../src/engine/teamRanking';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR, byRoleSlot } from '../src/domain/roles';
import type { PeriodSchedule } from '../src/engine/aggregate';
import type { RoleSlot } from '../src/domain/roles';
import teamStrengthRaw from '../src/data/raw/teamStrength.json';

const MARKET = teamStrengthRaw.polymarketTitleProbability as unknown as Record<string, number>;

const data = loadDataset();
const fixed = (k: number): PeriodSchedule => ({ seriesCountDistribution: new Map([[k, 1]]) });

function leaderAt(schedule: Readonly<Record<RoleSlot, PeriodSchedule>>) {
  const ctx = buildContext(data, { schedule });
  const ranking = rankTeams(evaluateRoleCandidates(ctx), data.roleUnits, ctx.period, MARKET);
  return byRoleSlot((slot) => ({
    teamId: ranking[slot].teams[0].teamId,
    margin: ranking[slot].leaderMargin,
    spread: ranking[slot].spread,
  }));
}

console.log('\n' + '='.repeat(76));
console.log('  A RECOMENDACAO MUDA COM O NUMERO DE SERIES?');
console.log('='.repeat(76));
console.log('\n  Todos os times com o mesmo numero de series:\n');
console.log('   K     PRINCIPAL          MEIO               SUPORTE');
console.log('  ' + '-'.repeat(72));

const results: Record<number, ReturnType<typeof leaderAt>> = {};
for (const k of [4, 5, 6]) {
  const r = leaderAt(byRoleSlot(() => fixed(k)));
  results[k] = r;
  const cell = (slot: RoleSlot) =>
    `${(data.teams.get(r[slot].teamId)?.tag ?? '?').padEnd(4)} ${(r[slot].margin * 100).toFixed(1).padStart(5)}%`;
  console.log(`   ${k}     ${cell('core').padEnd(19)}${cell('mid').padEnd(19)}${cell('support')}`);
}

const stable = ALL_ROLE_SLOTS.every((slot) =>
  results[4][slot].teamId === results[5][slot].teamId && results[5][slot].teamId === results[6][slot].teamId,
);
console.log(`\n  -> ${stable ? 'MESMO TIME NOS TRES CASOS' : 'A RECOMENDACAO MUDA'}`);

console.log('\n' + '-'.repeat(76));
console.log('  PIOR CENARIO: o recomendado joga 4 (atropela o grupo) e os rivais jogam 6');
console.log('-'.repeat(76));

/**
 * Comparacao assimetrica: pontua cada time com K=6 e confronta com o lider
 * pontuado a K=4. Se o lider AINDA vence, a recomendacao e imune ao Suico.
 */
const ctxSix = buildContext(data, { schedule: byRoleSlot(() => fixed(6)) });
const ctxFour = buildContext(data, { schedule: byRoleSlot(() => fixed(4)) });
const atSix = rankTeams(evaluateRoleCandidates(ctxSix), data.roleUnits, 'groupStage', MARKET);
const atFour = rankTeams(evaluateRoleCandidates(ctxFour), data.roleUnits, 'groupStage', MARKET);

for (const slot of ALL_ROLE_SLOTS) {
  const leaderId = results[5][slot].teamId;
  const leaderAtFour = atFour[slot].teams.find((t) => t.teamId === leaderId);
  const rivalsAtSix = atSix[slot].teams.filter((t) => t.teamId !== leaderId);
  const bestRival = rivalsAtSix[0];
  if (!leaderAtFour || !bestRival) continue;

  const survives = leaderAtFour.p75Score >= bestRival.p75Score;
  const delta = ((leaderAtFour.p75Score - bestRival.p75Score) / bestRival.p75Score) * 100;

  console.log(
    `\n  ${ROLE_LABEL_PT_BR[slot].toUpperCase().padEnd(11)} ${(data.teams.get(leaderId)?.name ?? '').padEnd(16)} a 4 series: ${Math.round(leaderAtFour.p75Score).toLocaleString('pt-BR')}`,
  );
  console.log(
    `              melhor rival ${(data.teams.get(bestRival.teamId)?.name ?? '').padEnd(16)} a 6 series: ${Math.round(bestRival.p75Score).toLocaleString('pt-BR')}`,
  );
  console.log(
    `              -> ${survives ? 'RESISTE' : 'CAI'}  (${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%)`,
  );
}
console.log('');
