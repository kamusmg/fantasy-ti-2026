/**
 * A COLA — o que a pessoa digita no cliente do Dota.
 *
 * Recomendacao no p75 dos estandartes possiveis (onde cai quem rerola com juizo),
 * nao na media nem no melhor caso.
 */
import { loadDataset } from '../src/data/load';
import { buildContext } from '../src/engine/context';
import { bestTitleForTeams, evaluateRoleCandidates } from '../src/engine/optimize';
import { isTechnicalTie, rankTeams } from '../src/engine/teamRanking';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR, ROLE_POSITIONS, byRoleSlot } from '../src/domain/roles';
import { PREFIX_DEFINITIONS, SUFFIX_DEFINITIONS } from '../src/domain/titles';
import { COLOR_LABEL_PT_BR } from '../src/domain/stats';

const data = loadDataset();
const ctx = buildContext(data);
const ranking = rankTeams(evaluateRoleCandidates(ctx), data.roleUnits, ctx.period);

const teams = byRoleSlot((slot) => ranking[slot].teams[0].teamId);
const scores = byRoleSlot((slot) => ranking[slot].teams[0].p75Score);
const { title, gain } = bestTitleForTeams(teams, scores, ctx);
const total = ALL_ROLE_SLOTS.reduce((a, s) => a + scores[s], 0) + gain;

const line = (c = '=') => console.log(c.repeat(72));

console.log('');
line();
console.log('  A COLA — FANTASY TI 2026, FASE DE GRUPOS');
console.log('  fecha 13/08 02:00 UTC  ·  trocar time e titulo e GRATIS ate la');
line();

const byLeverage = [...ALL_ROLE_SLOTS].sort((a, b) => ranking[b].spread - ranking[a].spread);

for (const slot of byLeverage) {
  const r = ranking[slot];
  const leader = r.teams[0];
  const second = r.teams[1];
  const unit = data.roleUnits.get(`${leader.teamId}:${slot}`);
  const nicks = (unit?.playerIds ?? []).map((id) => data.players.get(id)?.nick ?? id).join(' + ');
  const tie = isTechnicalTie(r.leaderMargin);

  console.log(`\n  ${ROLE_LABEL_PT_BR[slot].toUpperCase()}  (pos ${ROLE_POSITIONS[slot].join('+')})   errar aqui custa ate -${(r.spread * 100).toFixed(0)}%`);
  console.log(`     >>> ${data.teams.get(leader.teamId)?.name?.toUpperCase()}`);
  console.log(`         ${nicks}`);
  console.log(
    tie
      ? `         EMPATE TECNICO com ${data.teams.get(second.teamId)?.name} (${(r.leaderMargin * 100).toFixed(1)}%) — tanto faz`
      : `         ${(r.leaderMargin * 100).toFixed(0)}% a frente de ${data.teams.get(second.teamId)?.name}`,
  );
  if (leader.robust) console.log('         vale pra QUALQUER estandarte que voce tirar');
}

console.log(`\n  TREINADOR`);
console.log(`     >>> ${title.prefix ? PREFIX_DEFINITIONS[title.prefix].labelPtBr.toUpperCase() : '-'} · ${title.suffix ? SUFFIX_DEFINITIONS[title.suffix].labelPtBr.toUpperCase() : '-'}`);
if (title.prefix) console.log(`         +${(PREFIX_DEFINITIONS[title.prefix].bonus * 100).toFixed(0)}% quando ${PREFIX_DEFINITIONS[title.prefix].conditionPtBr}`);
if (title.suffix) console.log(`         +${(SUFFIX_DEFINITIONS[title.suffix].bonus * 100).toFixed(0)}% quando ${SUFFIX_DEFINITIONS[title.suffix].conditionPtBr}`);

console.log('');
line('-');
console.log('  AS 40 FICHAS — onde rerolar PAGA mais (ganho medido, media -> p90)');
line('-');
for (const slot of [...ALL_ROLE_SLOTS].sort((a, b) => ranking[b].rerollPayoff - ranking[a].rerollPayoff)) {
  console.log(`    ${ROLE_LABEL_PT_BR[slot].padEnd(11)} +${(ranking[slot].rerollPayoff * 100).toFixed(0)}%`);
}

const tieRoles = ALL_ROLE_SLOTS.filter((s) => isTechnicalTie(ranking[s].leaderMargin));
console.log('');
console.log(`  >>> A BRIGA NAO E PELO TIME, E PELAS FICHAS.`);
console.log(`      ${tieRoles.map((s) => ROLE_LABEL_PT_BR[s]).join(' e ')} sao empate (~1%).`);
console.log(`      Rerolar bem o Meio vale +${(ranking.mid.rerollPayoff * 100).toFixed(0)}% — quase 50x mais.`);

console.log('\n  So da pra consertar STAT cirurgicamente em emblema VERDE.');
console.log('  Vermelho so mira QUALIDADE, azul so mira TRACO — nos dois, subir');
console.log('  qualidade de stat ruim e polir lixo.');
console.log('\n  ATENCAO: com FRACTAL no estandarte, SUBIR uma qualidade pode PIORAR');
console.log('  a nota — ele so paga se as tres qualidades forem diferentes.');

console.log('');
line('-');
console.log('  O QUE GUARDAR E O QUE REROLAR, no time recomendado');
line('-');
for (const slot of byLeverage) {
  const leader = ranking[slot].teams[0];
  console.log(`\n    ${ROLE_LABEL_PT_BR[slot].toUpperCase()} — ${data.teams.get(leader.teamId)?.name}`);
  for (const color of leader.rerollTargets) {
    const keep = color.targets.filter((t) => t.verdict === 'guardar').map((t) => t.labelPtBr);
    const drop = color.targets.filter((t) => t.verdict === 'rerolar').map((t) => t.labelPtBr);
    console.log(`      ${COLOR_LABEL_PT_BR[color.color].toUpperCase().padEnd(9)} guarda: ${keep.join(', ') || '-'}`);
    console.log(`      ${''.padEnd(9)} rerola: ${drop.join(', ') || '-'}`);
  }
}

console.log('');
line();
console.log(`  nota do modelo: ${Math.round(total).toLocaleString('pt-BR')}  (relativa, nao e previsao dos seus pontos)`);
line();
console.log('');
