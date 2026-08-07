/**
 * TESTE DA MALDICAO DO VENCEDOR.
 *
 * O ranking "melhor estandarte" e um MAXIMO sobre 180-216 atribuicoes ruidosas.
 * Quem vence um maximo tende a ser quem carrega o maior ERRO DE ESTIMATIVA, nao
 * o maior valor real — ainda mais quando a media ja passou por encolhimento
 * empirico-Bayes e o maximo existe justamente pra derrotar esse encolhimento.
 *
 * O teste: efeito REAL sobe monotonicamente da media pro p75 pro maximo.
 * Maldicao do vencedor aparece SO no maximo.
 *
 * E o p75 e, alem disso, a base mais honesta de recomendacao: e onde cai quem
 * rerola com juizo. Nem a media (quem nao rerolou nada) nem o maximo (quem teve
 * sorte perfeita) descrevem uma pessoa de verdade.
 */
import { loadDataset } from '../src/data/load';
import { buildContext } from '../src/engine/context';
import { evaluateRoleCandidates } from '../src/engine/optimize';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR } from '../src/domain/roles';

const data = loadDataset();
const ctx = buildContext(data);
const candidates = evaluateRoleCandidates(ctx);

function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

const fmt = (v: number) => Math.round(v).toLocaleString('pt-BR');

for (const slot of ALL_ROLE_SLOTS) {
  const byTeam = new Map<string, number[]>();
  for (const c of candidates[slot]) {
    const list = byTeam.get(c.teamId) ?? [];
    list.push(c.perPeriod.mean);
    byTeam.set(c.teamId, list);
  }

  const rows = [...byTeam.entries()].map(([teamId, values]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      teamId,
      name: data.teams.get(teamId)?.name ?? teamId,
      mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
      p50: quantile(sorted, 0.5),
      p75: quantile(sorted, 0.75),
      p90: quantile(sorted, 0.90),
      max: sorted[sorted.length - 1],
    };
  });

  const rankAt = (key: 'mean' | 'p50' | 'p75' | 'p90' | 'max') =>
    new Map([...rows].sort((a, b) => b[key] - a[key]).map((r, i) => [r.teamId, i + 1]));

  const rMean = rankAt('mean');
  const rP75 = rankAt('p75');
  const rP90 = rankAt('p90');
  const rMax = rankAt('max');

  console.log(`\n${'='.repeat(92)}`);
  console.log(`  ${ROLE_LABEL_PT_BR[slot].toUpperCase()}  —  posicao em cada quantil do estandarte`);
  console.log('='.repeat(92));
  console.log('   media   p75   p90   max   TIME              p75 (pts)   veredito');
  console.log('  ' + '-'.repeat(88));

  for (const r of [...rows].sort((a, b) => b.p75 - a.p75)) {
    const m = rMean.get(r.teamId)!;
    const q75 = rP75.get(r.teamId)!;
    const q90 = rP90.get(r.teamId)!;
    const mx = rMax.get(r.teamId)!;

    // Sobe muito so no maximo e nao no meio do caminho = maldicao do vencedor.
    const jumpsOnlyAtMax = m - mx >= 6 && m - q90 <= 2;
    const monotone = m >= q75 && q75 >= q90 && q90 >= mx && m - mx >= 3;
    const verdict = jumpsOnlyAtMax ? 'MALDICAO DO VENCEDOR' : monotone ? 'sobe monotonico (real)' : '';

    console.log(
      `  ${String(m).padStart(6)}  ${String(q75).padStart(4)}  ${String(q90).padStart(4)}  ${String(mx).padStart(4)}   ${r.name.padEnd(16)} ${fmt(r.p75).padStart(9)}   ${verdict}`,
    );
  }

  const byP75 = [...rows].sort((a, b) => b.p75 - a.p75);
  const gap = ((byP75[0].p75 - byP75[1].p75) / byP75[1].p75) * 100;
  const spread = ((byP75[0].p75 - byP75[byP75.length - 1].p75) / byP75[byP75.length - 1].p75) * 100;
  console.log(`  -> No p75: 1o = ${byP75[0].name}, ${gap.toFixed(1)}% a frente do 2o. Espalhamento 1o-16o: ${spread.toFixed(1)}%`);
}

console.log(`\n${'='.repeat(92)}`);
console.log('  PAGAMENTO DO REROLL POR FUNCAO — ganho da media ate o p90, no time recomendado');
console.log('='.repeat(92));

for (const slot of ALL_ROLE_SLOTS) {
  const byTeam = new Map<string, number[]>();
  for (const c of candidates[slot]) {
    const list = byTeam.get(c.teamId) ?? [];
    list.push(c.perPeriod.mean);
    byTeam.set(c.teamId, list);
  }
  const rows = [...byTeam.entries()].map(([teamId, values]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      teamId,
      name: data.teams.get(teamId)?.name ?? teamId,
      mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
      p75: quantile(sorted, 0.75),
      p90: quantile(sorted, 0.90),
    };
  });
  const leader = rows.sort((a, b) => b.p75 - a.p75)[0];
  const gain = leader.p90 - leader.mean;
  console.log(
    `  ${ROLE_LABEL_PT_BR[slot].padEnd(11)} ${leader.name.padEnd(16)} media ${fmt(leader.mean).padStart(7)} -> p90 ${fmt(leader.p90).padStart(7)}   ganho ${fmt(gain).padStart(6)} pts (${((gain / leader.mean) * 100).toFixed(1)}%)`,
  );
}
console.log('');
