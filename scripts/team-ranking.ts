/**
 * QUAL TIME ESCOLHER — a unica decisao 100% livre do fantasy.
 *
 * As stats do estandarte sao SORTEADAS, nao escolhidas. Entao "meu build de 9
 * stats" nao e copiavel: o estandarte de cada pessoa e diferente. O que e
 * copiavel e o TIME por funcao e o TITULO do treinador.
 *
 * Por isso cada time e avaliado de DUAS formas:
 *   MEDIA  — media sobre TODOS os estandartes legais, com peso igual. E o cenario
 *            "nao rolei nada / rolei mal". Como as cores sao fixas, o conjunto de
 *            estandartes possiveis e conhecido mesmo sem saber as stats.
 *   TETO   — o melhor estandarte possivel. E o cenario "meus rerolls deram certo".
 *
 * Time que lidera nos DOIS e recomendacao robusta: serve pra quem rolou bem e pra
 * quem rolou mal. Time que so lidera no teto e uma aposta na sorte do roll.
 */
import { loadDataset } from '../src/data/load';
import { buildContext } from '../src/engine/context';
import { evaluateRoleCandidates } from '../src/engine/optimize';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR } from '../src/domain/roles';
import { STAT_DEFINITIONS } from '../src/domain/stats';

const data = loadDataset();
const ctx = buildContext(data);
const candidates = evaluateRoleCandidates(ctx);

const fmt = (v: number) => Math.round(v).toLocaleString('pt-BR');

for (const slot of ALL_ROLE_SLOTS) {
  const byTeam = new Map<string, { mean: number; best: number; bestStats: string; n: number }>();

  for (const c of candidates[slot]) {
    const entry = byTeam.get(c.teamId) ?? { mean: 0, best: -Infinity, bestStats: '', n: 0 };
    entry.mean += c.perPeriod.mean;
    entry.n += 1;
    if (c.perPeriod.mean > entry.best) {
      entry.best = c.perPeriod.mean;
      entry.bestStats = c.statIds.map((s) => STAT_DEFINITIONS[s].labelPtBr).join(' / ');
    }
    byTeam.set(c.teamId, entry);
  }

  const rows = [...byTeam.entries()].map(([teamId, e]) => ({
    teamId,
    name: data.teams.get(teamId)?.name ?? teamId,
    mean: e.mean / e.n,
    best: e.best,
    bestStats: e.bestStats,
  }));

  const byMean = [...rows].sort((a, b) => b.mean - a.mean);
  const byBest = [...rows].sort((a, b) => b.best - a.best);
  const rankMean = new Map(byMean.map((r, i) => [r.teamId, i + 1]));
  const rankBest = new Map(byBest.map((r, i) => [r.teamId, i + 1]));

  console.log(`\n${'='.repeat(88)}`);
  console.log(`  ${ROLE_LABEL_PT_BR[slot].toUpperCase()}`);
  console.log('='.repeat(88));
  console.log('  #med  #teto  TIME              MEDIA     TETO   melhor estandarte');
  console.log('  ' + '-'.repeat(84));

  for (const r of byMean) {
    const rm = rankMean.get(r.teamId)!;
    const rb = rankBest.get(r.teamId)!;
    const robust = rm <= 3 && rb <= 3 ? ' <= ROBUSTO' : '';
    console.log(
      `  ${String(rm).padStart(4)}  ${String(rb).padStart(5)}  ${r.name.padEnd(16)} ${fmt(r.mean).padStart(7)}  ${fmt(r.best).padStart(7)}   ${r.bestStats}${robust}`,
    );
  }

  const top = byMean[0];
  const spread = ((byMean[0].mean - byMean[byMean.length - 1].mean) / byMean[byMean.length - 1].mean) * 100;
  console.log(`  -> lider na media: ${top.name}. Distancia do 1o ao 16o: ${spread.toFixed(1)}%`);
}

console.log('\n' + '='.repeat(88));
console.log('  LEITURA: a coluna MEDIA e o que vale pra quem NAO rolou bem — e a maioria.');
console.log('  Time bem colocado nas duas colunas e a escolha que nao depende de sorte.');
console.log('='.repeat(88) + '\n');
