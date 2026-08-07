/**
 * GUIA DE REROLL — o que fazer com o estandarte que VOCE tirou.
 *
 * Como as stats sao sorteadas, este e o output que serve pra qualquer pessoa,
 * independentemente do que caiu no estandarte dela.
 */
import { loadDataset } from '../src/data/load';
import { colorConcentration, rerollTargets } from '../src/engine/rerollTargets';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR } from '../src/domain/roles';
import { COLOR_LABEL_PT_BR } from '../src/domain/stats';

const data = loadDataset();

/** Times recomendados pelo ranking robusto (media E teto). */
const RECOMMENDED: Record<string, string> = { core: 'lgd', mid: 'liquid', support: 'lgd' };

for (const slot of ALL_ROLE_SLOTS) {
  const teamId = RECOMMENDED[slot];
  const unit = data.roleUnits.get(`${teamId}:${slot}`);
  if (!unit) continue;

  console.log(`\n${'='.repeat(78)}`);
  console.log(`  ${ROLE_LABEL_PT_BR[slot].toUpperCase()} — ${data.teams.get(teamId)?.name}`);
  console.log('='.repeat(78));

  for (const color of rerollTargets(unit, 'groupStage')) {
    const concentration = colorConcentration(color);
    const advice = concentration > 0.35
      ? 'CONCENTRADA — vale gastar token aqui'
      : 'ACHATADA — fique com o que veio, gaste token em outra cor';
    console.log(`\n  ${COLOR_LABEL_PT_BR[color.color].toUpperCase()} (${color.emblemCount} emblema${color.emblemCount > 1 ? 's' : ''})  ·  ${advice}`);
    console.log('  ' + '-'.repeat(74));
    for (const t of color.targets) {
      const bar = '#'.repeat(Math.round(t.shareOfBest * 26));
      const mark = t.verdict === 'guardar' ? 'GUARDAR ' : t.verdict === 'aceitavel' ? 'aceita  ' : 'REROLAR ';
      console.log(
        `    ${mark} ${t.labelPtBr.padEnd(26)} ${Math.round(t.value).toString().padStart(5)}  ${(t.shareOfBest * 100).toFixed(0).padStart(3)}%  ${bar}`,
      );
    }
  }
}

console.log(`\n${'='.repeat(78)}`);
console.log('  COMO USAR: olhe a cor de cada emblema que VOCE tirou e ache a stat que caiu.');
console.log('  GUARDAR = nao gaste token. REROLAR = vale a troca. Cor achatada = nao insista.');
console.log('='.repeat(78) + '\n');
