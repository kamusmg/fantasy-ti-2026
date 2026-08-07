/**
 * O ranking COMPLETO das 6 stats de cada cor, por funcao — medido, nao opinado.
 *
 * A tabela do guia so trazia as "principais"; isto e o que fecha os buracos com
 * o valor que o motor ja calcula pro time lider de cada funcao.
 */
import { loadDataset } from '../src/data/load';
import { buildContext } from '../src/engine/context';
import { evaluateRoleCandidates } from '../src/engine/optimize';
import { rankTeams } from '../src/engine/teamRanking';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR } from '../src/domain/roles';
import { COLOR_LABEL_PT_BR, STAT_DEFINITIONS } from '../src/domain/stats';
import teamStrengthRaw from '../src/data/raw/teamStrength.json';

const MARKET = teamStrengthRaw.polymarketTitleProbability as unknown as Record<string, number>;
const data = loadDataset();
const ctx = buildContext(data);
const ranking = rankTeams(evaluateRoleCandidates(ctx), data.roleUnits, ctx.period, MARKET);

for (const slot of ALL_ROLE_SLOTS) {
  const leader = ranking[slot].teams[0];
  console.log(`\n### ${ROLE_LABEL_PT_BR[slot]}  (lider: ${leader.teamId})`);
  for (const color of leader.rerollTargets) {
    const top = color.targets[0].value;
    console.log(`  ${COLOR_LABEL_PT_BR[color.color]} x${color.emblemCount}`);
    for (const t of color.targets) {
      const pct = top > 0 ? (t.value / top) * 100 : 0;
      console.log(
        `    ${STAT_DEFINITIONS[t.statId].labelPtBr.padEnd(26)} ${t.value.toFixed(0).padStart(6)}  ${pct.toFixed(0).padStart(3)}%  ${t.verdict}`,
      );
    }
  }
}
