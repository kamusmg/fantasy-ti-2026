/**
 * A RESPOSTA. Escalacao otima pra Fase de Grupos do TI 2026, pronta pra digitar
 * no cliente.
 */
import { loadDataset } from '../src/data/load';
import { buildContext } from '../src/engine/context';
import { bestPerTeam, evaluateRoleCandidates, optimizeLineup } from '../src/engine/optimize';
import { CONSERVATIVE, expectedScore } from '../src/engine/objectives';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR, ROLE_POSITIONS } from '../src/domain/roles';
import { PREFIX_DEFINITIONS, SUFFIX_DEFINITIONS } from '../src/domain/titles';
import { STAT_DEFINITIONS } from '../src/domain/stats';
import { COLOR_LABEL_PT_BR } from '../src/domain/stats';

const data = loadDataset();
const ctx = buildContext(data);

const t0 = performance.now();
const ranked = optimizeLineup(ctx, expectedScore, 5);
const elapsed = performance.now() - t0;

const candidates = evaluateRoleCandidates(ctx);
const totalCandidates = ALL_ROLE_SLOTS.reduce((acc, s) => acc + candidates[s].length, 0);

const fmt = (v: number) => Math.round(v).toLocaleString('pt-BR');
const best = ranked[0];

console.log('\n' + '='.repeat(74));
console.log('  A ESCALACAO  —  FASE DE GRUPOS TI 2026');
console.log('='.repeat(74));

for (const slot of ALL_ROLE_SLOTS) {
  const c = best.perRole[slot];
  const team = data.teams.get(c.teamId);
  const unit = data.roleUnits.get(`${c.teamId}:${slot}`);
  const nicks = (unit?.playerIds ?? []).map((id) => data.players.get(id)?.nick ?? id).join(' + ');

  console.log(`\n  ${ROLE_LABEL_PT_BR[slot].toUpperCase()}  (pos ${ROLE_POSITIONS[slot].join('+')})`);
  console.log(`     TIME:  ${team?.name}`);
  console.log(`     ${nicks}`);
  console.log(`     estandarte:`);
  for (const e of c.emblems) {
    const def = STAT_DEFINITIONS[e.statId];
    const base = e.base;
    const selo = base.provenance === 'league-mean-fallback'
      ? ' [media da liga]'
      : ` [${(base.shrinkWeight * 100).toFixed(0)}% time]`;
    console.log(
      `       ${e.index + 1}. ${COLOR_LABEL_PT_BR[def.color].padEnd(9)} ${def.labelPtBr.padEnd(26)} ${fmt(e.total).padStart(6)} pts${selo}`,
    );
  }
  console.log(`     nota do periodo: ${fmt(c.perPeriod.mean)}  (p10 ${fmt(c.perPeriod.p10)} / p90 ${fmt(c.perPeriod.p90)})`);
}

console.log(`\n  TREINADOR:  ${best.title.prefix ? PREFIX_DEFINITIONS[best.title.prefix].labelPtBr : '-'} ... ${best.title.suffix ? SUFFIX_DEFINITIONS[best.title.suffix].labelPtBr : '-'}`);
if (best.title.prefix) {
  console.log(`     prefixo: +${(PREFIX_DEFINITIONS[best.title.prefix].bonus * 100).toFixed(0)}% quando ${PREFIX_DEFINITIONS[best.title.prefix].conditionPtBr}`);
}
if (best.title.suffix) {
  console.log(`     sufixo:  +${(SUFFIX_DEFINITIONS[best.title.suffix].bonus * 100).toFixed(0)}% quando ${SUFFIX_DEFINITIONS[best.title.suffix].conditionPtBr}`);
}

console.log('\n' + '-'.repeat(74));
console.log(`  TOTAL:  ${fmt(best.total.mean)} pts     (sem treinador ${fmt(best.baseTotal.mean)}, titulo +${fmt(best.titleGain)})`);
console.log(`  faixa:  p10 ${fmt(best.total.p10)}   p50 ${fmt(best.total.p50)}   p90 ${fmt(best.total.p90)}`);
console.log('-'.repeat(74));

console.log('\n=== ALTERNATIVAS DE TITULO (mesmo motor) ===');
for (const r of ranked) {
  const teams = ALL_ROLE_SLOTS.map((s) => data.teams.get(r.perRole[s].teamId)?.tag).join('/');
  console.log(`  ${fmt(r.total.mean).padStart(7)}  ${(r.title.prefix ?? '-').padEnd(13)} ${(r.title.suffix ?? '-').padEnd(20)} ${teams}`);
}

console.log('\n=== MELHOR TIME POR FUNCAO (sem titulo) ===');
for (const slot of ALL_ROLE_SLOTS) {
  console.log(`\n  ${ROLE_LABEL_PT_BR[slot].toUpperCase()}`);
  for (const c of bestPerTeam(candidates[slot]).slice(0, 6)) {
    const team = data.teams.get(c.teamId);
    const stats = c.statIds.map((s) => STAT_DEFINITIONS[s].labelPtBr).join(' / ');
    console.log(`    ${fmt(c.perPeriod.mean).padStart(6)}  ${(team?.name ?? c.teamId).padEnd(16)} ${stats}`);
  }
}

console.log('\n=== SE PREFERIR O CENARIO RUIM (p10 em vez da media) ===');
const conservative = optimizeLineup(ctx, CONSERVATIVE, 1)[0];
const sameTeams = ALL_ROLE_SLOTS.every((s) => conservative.perRole[s].teamId === best.perRole[s].teamId);
console.log(`  ${sameTeams ? 'MESMOS TIMES' : 'TIMES DIFERENTES'}: ` +
  ALL_ROLE_SLOTS.map((s) => `${ROLE_LABEL_PT_BR[s]}=${data.teams.get(conservative.perRole[s].teamId)?.tag}`).join('  '));

console.log(`\n  ${totalCandidates.toLocaleString('pt-BR')} candidatos avaliados x 64 titulos em ${elapsed.toFixed(0)} ms\n`);
