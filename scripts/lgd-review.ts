/**
 * REVISAO DA APOSTA NO LGD.
 *
 * O LGD e o classificado sul-americano. O mercado de apostas poe eles em 12o de
 * 16, e o nosso modelo poe em 1o no Suporte com 13% de vantagem — a maior
 * margem da ferramenta. Antes de publicar isso, tres perguntas:
 *
 *   1. Quem sustenta o numero? So o Reddit, ou o battlepass tambem?
 *   2. Quanto de penalidade extra derruba a recomendacao? Se 3% ja vira, e
 *      fragil; se precisar de 15%, aguenta.
 *   3. Se o LGD sair, quem entra e quanto se perde?
 */
import { loadDataset } from '../src/data/load';
import { buildContext } from '../src/engine/context';
import { evaluateRoleCandidates } from '../src/engine/optimize';
import { rankTeams } from '../src/engine/teamRanking';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR } from '../src/domain/roles';
import { roleUnitKey } from '../src/domain/roster';
import strength from '../src/data/raw/teamStrength.json';

const MARKET = strength.polymarketTitleProbability as unknown as Record<string, number>;

const data = loadDataset();
const ctx = buildContext(data);
const candidates = evaluateRoleCandidates(ctx);
const ranking = rankTeams(candidates, data.roleUnits, 'groupStage', MARKET);

const name = (id: string) => data.teams.get(id)?.name ?? id;
const market = strength.polymarketTitleProbability as unknown as Record<string, number>;

console.log('\n' + '='.repeat(80));
console.log('  1. QUEM SUSTENTA O NUMERO DO LGD');
console.log('='.repeat(80));

for (const slot of ALL_ROLE_SLOTS) {
  const published = data.battlepassTopRoles[slot].find((e) => e.teamId === 'lgd');
  const cutoff = Math.min(...data.battlepassTopRoles[slot].map((e) => e.roleScore));
  const rank = data.battlepassTopRoles[slot].findIndex((e) => e.teamId === 'lgd') + 1;

  console.log(`\n  ${ROLE_LABEL_PT_BR[slot].toUpperCase()}`);
  if (published) {
    console.log(`    battlepass (2.888 replays TI-relevantes): ${rank}o de 8, nota ${published.roleScore}, ${published.sharedMaps} mapas juntos`);
  } else {
    console.log(`    battlepass: NAO esta no top-8 (corte em ${cutoff}) — so o Reddit sustenta`);
  }
  const ourRank = ranking[slot].teams.findIndex((tm) => tm.teamId === 'lgd') + 1;
  console.log(`    nosso modelo: ${ourRank}o de 16`);

  const unit = data.roleUnits.get(roleUnitKey('lgd', slot));
  if (unit) {
    const weights = Object.values(unit.perMapStat).map((e) => e.shrinkWeight);
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
    console.log(`    peso medio do dado de time (0 = so media de liga, 1 = so o time): ${avg.toFixed(2)}`);
  }
}

console.log(`\n  mercado de apostas: LGD em ${Object.entries(market).filter(([k]) => !k.startsWith('_')).sort((a, b) => b[1] - a[1]).findIndex(([k]) => k === 'lgd') + 1}o de 16 (${(market.lgd * 100).toFixed(1)}% de titulo)`);

console.log('\n' + '='.repeat(80));
console.log('  2. QUANTA PENALIDADE DERRUBA A RECOMENDACAO?');
console.log('='.repeat(80));
console.log('\n  Aplico um desconto direto so no LGD e vejo quando ele perde a lideranca.\n');

for (const slot of ALL_ROLE_SLOTS) {
  const rows = ranking[slot].teams;
  const lgd = rows.find((tm) => tm.teamId === 'lgd');
  if (!lgd) continue;
  const best = rows.filter((tm) => tm.teamId !== 'lgd')[0];
  const penaltyToFlip = 1 - best.p75Score / lgd.p75Score;
  const leads = rows[0].teamId === 'lgd';

  console.log(
    `  ${ROLE_LABEL_PT_BR[slot].padEnd(11)} ${leads ? 'LIDERA' : `${rows.findIndex((tm) => tm.teamId === 'lgd') + 1}o   `}  ` +
    (leads
      ? `perde pra ${name(best.teamId)} com ${(penaltyToFlip * 100).toFixed(1)}% de penalidade`
      : `ja nao lidera`),
  );
}

console.log('\n' + '='.repeat(80));
console.log('  3. E SE O LGD NAO EXISTISSE?');
console.log('='.repeat(80));

for (const slot of ALL_ROLE_SLOTS) {
  const rows = ranking[slot].teams.filter((tm) => tm.teamId !== 'lgd');
  const withLgd = ranking[slot].teams[0];
  const without = rows[0];
  const loss = (1 - without.p75Score / withLgd.p75Score) * 100;
  console.log(
    `\n  ${ROLE_LABEL_PT_BR[slot].toUpperCase()}: sem LGD o 1o vira ${name(without.teamId)}` +
    (withLgd.teamId === 'lgd' ? `, custando ${loss.toFixed(1)}%` : ' (o LGD nao era o 1o)'),
  );
  for (const r of rows.slice(0, 3)) {
    console.log(`     ${Math.round(r.p75Score).toLocaleString('pt-BR').padStart(7)}  ${name(r.teamId)}`);
  }
}
console.log('');
