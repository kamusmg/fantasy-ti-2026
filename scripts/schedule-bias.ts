/**
 * A tabela do Reddit cobre 13 torneios de nivel misto; a do battlepass e
 * TI-relevante. Se uma stat inflar contra oposicao fraca, o z-score dela no
 * Reddit vai ser um MAU preditor de estar no top-8 do battlepass.
 *
 * Isso e testavel: pra cada stat, comparar o z medio dos times que entraram no
 * top-8 com o dos que ficaram de fora. Stat honesta -> quem esta no top-8 tem z
 * mais alto. Stat contaminada por forca de tabela -> a diferenca some ou inverte.
 */
import { loadDataset } from '../src/data/load';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR, playersInRole } from '../src/domain/roles';
import { ALL_STAT_IDS, STAT_DEFINITIONS } from '../src/domain/stats';
import redditRaw from '../src/data/raw/reddit.roleStats.json';

const data = loadDataset();

type Row = Record<string, number | string | undefined>;
const reddit = redditRaw as unknown as Record<string, Record<string, Row>>;

for (const slot of ALL_ROLE_SLOTS) {
  const inTop8 = new Set(data.battlepassTopRoles[slot].map((p) => p.teamId));
  const rows = Object.entries(reddit[slot]).filter(([k]) => !k.startsWith('_'));

  console.log(`\n=== ${ROLE_LABEL_PT_BR[slot].toUpperCase()} — separacao entre top-8 e resto, por stat ===`);
  console.log('   (z medio dos que ESTAO no top-8 menos z medio dos que NAO estao)');

  const results: { stat: string; separation: number; leagueValue: number }[] = [];

  for (const stat of ALL_STAT_IDS) {
    const values = rows
      .map(([teamId, row]) => ({ teamId, v: row[stat] }))
      .filter((r): r is { teamId: string; v: number } => typeof r.v === 'number')
      .map((r) => ({ teamId: r.teamId, v: r.v / playersInRole(slot) }));
    if (values.length < 12) continue;

    const mu = values.reduce((a, b) => a + b.v, 0) / values.length;
    const sd = Math.sqrt(values.reduce((a, b) => a + (b.v - mu) ** 2, 0) / values.length);
    if (sd === 0) continue;

    const zIn = values.filter((v) => inTop8.has(v.teamId)).map((v) => (v.v - mu) / sd);
    const zOut = values.filter((v) => !inTop8.has(v.teamId)).map((v) => (v.v - mu) / sd);
    if (zIn.length === 0 || zOut.length === 0) continue;

    const separation =
      zIn.reduce((a, b) => a + b, 0) / zIn.length - zOut.reduce((a, b) => a + b, 0) / zOut.length;
    results.push({ stat: STAT_DEFINITIONS[stat].labelPtBr, separation, leagueValue: data.leagueMean[slot][stat] });
  }

  results.sort((a, b) => b.separation - a.separation);
  for (const r of results) {
    const bar = r.separation >= 0 ? '+'.repeat(Math.round(r.separation * 10)) : '-'.repeat(Math.round(-r.separation * 10));
    const warn = r.separation < -0.2 && r.leagueValue > 600 ? '  <-- STAT VALIOSA QUE ANTI-PREVE FORCA' : '';
    console.log(`  ${r.stat.padEnd(26)} ${r.separation >= 0 ? ' ' : ''}${r.separation.toFixed(2)}  ${bar}${warn}`);
  }
}
