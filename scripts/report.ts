/** Relatorio de linha de comando pra conferir os numeros com os proprios olhos. */
import { loadDataset } from '../src/data/load';
import { auditDataset } from '../src/data/audit';
import { prefixLeagueMeans } from '../src/engine/coach';
import { ALL_ROLE_SLOTS } from '../src/domain/roles';

const data = loadDataset();
const report = auditDataset(data, prefixLeagueMeans(data.players.values()).cerulean);

const n = (v: number, d = 0) => v.toFixed(d).padStart(7);

console.log('\n=== ESCALA POR FUNCAO (k) ===');
for (const slot of ALL_ROLE_SLOTS) {
  console.log(`  ${slot.padEnd(8)} k = ${report.scaleFactor[slot].toFixed(4)}`);
}

console.log('\n=== ORACULO BATTLEPASS ===');
for (const o of report.oracle) {
  console.log(`  ${o.titleId.padEnd(10)} bonus ${(o.bonus * 100).toFixed(0)}%  ganho ${n(o.publishedGain)}  -> P = ${o.impliedProbability.toFixed(4)}`);
}
console.log(`  heroi azul: battlepass ${report.ceruleanFromBattlepass.toFixed(4)} vs Reddit ${report.ceruleanFromReddit.toFixed(4)}  (dif ${(Math.abs(report.ceruleanFromBattlepass - report.ceruleanFromReddit) / report.ceruleanFromBattlepass * 100).toFixed(1)}%)`);

console.log('\n=== CONFERENCIA DAS NOTAS DO TOP-8 DO BATTLEPASS ===');
for (const c of report.topRoleChecks) {
  const flag = c.flagged ? '  <-- FORA DA FAIXA' : '';
  console.log(`  ${c.slot.padEnd(8)} ${c.teamId.padEnd(12)} publicado ${n(c.publishedRoleScore)}  nosso ${n(c.ourRoleScore)}  razao ${c.ratio.toFixed(3)}  (${c.sharedMaps} mapas)${flag}`);
}

console.log('\n=== RESIDUOS FORA DA FAIXA [0,80 - 1,25] ===');
const flagged = report.residuals.filter((r) => r.flagged);
if (flagged.length === 0) console.log('  nenhum');
for (const r of flagged) {
  console.log(`  ${r.slot.padEnd(8)} ${r.labelPtBr.padEnd(26)} battlepass ${n(r.battlepassLeagueMean)}  nosso ${n(r.redditLeagueMeanScaled ?? 0)}  razao ${r.ratio?.toFixed(3)}`);
}

console.log('\n=== FORCA DO PRIOR (n0) — quanto cada stat encolhe ===');
for (const slot of ALL_ROLE_SLOTS) {
  const rows = report.residuals
    .filter((r) => r.slot === slot && Number.isFinite(r.priorStrength))
    .sort((a, b) => b.priorStrength - a.priorStrength)
    .slice(0, 4);
  const infinite = report.residuals.filter((r) => r.slot === slot && !Number.isFinite(r.priorStrength)).length;
  console.log(`  ${slot}: ${rows.map((r) => `${r.labelPtBr}=${r.priorStrength.toFixed(0)}`).join('  ')}   (${infinite} stats com encolhimento total)`);
}

console.log('\n=== AVISOS ===');
for (const w of report.warnings.slice(0, 12)) {
  console.log(`  [${w.severity}] ${w.messagePtBr}`);
}
console.log(`  (${report.warnings.length} avisos no total)\n`);
