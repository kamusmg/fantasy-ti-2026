/**
 * A ausencia de um time no top-8 do battlepass NAO e falta de informacao — e uma
 * observacao CENSURADA A DIREITA: sabemos que a nota dele fica ABAIXO do 8o lugar.
 *
 * Este script confronta o que o nosso modelo diz com esse teto, no proprio
 * estandarte de referencia do battlepass (tudo Tier III, sem tracos).
 */
import { loadDataset } from '../src/data/load';
import { reproduceTopRoleScore } from '../src/data/audit';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR } from '../src/domain/roles';

const data = loadDataset();

for (const slot of ALL_ROLE_SLOTS) {
  const published = data.battlepassTopRoles[slot];
  const cutoff = Math.min(...published.map((p) => p.roleScore));
  const listed = new Set(published.map((p) => p.teamId));

  console.log(`\n=== ${ROLE_LABEL_PT_BR[slot].toUpperCase()} — teto implicito do top-8: ${cutoff} ===`);

  const rows: { team: string; ours: number; listed: boolean; violates: boolean }[] = [];
  for (const [teamId, team] of data.teams) {
    const ours = reproduceTopRoleScore(data, slot, teamId);
    if (ours === null) continue;
    rows.push({
      team: team.name,
      ours,
      listed: listed.has(teamId),
      violates: !listed.has(teamId) && ours > cutoff,
    });
  }

  rows.sort((a, b) => b.ours - a.ours);
  for (const r of rows) {
    const mark = r.listed ? 'top-8' : '     ';
    const flag = r.violates ? '  <-- CONTRADIZ O TETO' : '';
    console.log(`  ${Math.round(r.ours).toString().padStart(6)}  ${mark}  ${r.team}${flag}`);
  }

  const violations = rows.filter((r) => r.violates).length;
  console.log(`  -> ${violations} time(s) que o nosso modelo poe acima do teto do battlepass`);
}

console.log('\n=== AMOSTRA: quem tem contagem publicada e quem esta no assumido de 60 ===');
for (const slot of ALL_ROLE_SLOTS) {
  const known = new Set(data.battlepassTopRoles[slot].map((p) => p.teamId));
  const assumed = [...data.teams.keys()].filter((t) => !known.has(t));
  console.log(`  ${ROLE_LABEL_PT_BR[slot].padEnd(10)} assumido: ${assumed.join(', ')}`);
}
