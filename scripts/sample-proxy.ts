/**
 * A coluna `top` (melhor partida unica) e um estimador de tamanho de amostra que
 * eu estava jogando fora: E[maximo de n] cresce com n. Razao top/average baixa =
 * poucos jogos, ou pool de oposicao estreito.
 *
 * Antes de usar, CALIBRAR: os times que tem contagem publicada pelo battlepass
 * devem mostrar razao maior quanto maior a contagem. Se nao mostrarem, o proxy
 * nao presta e nao entra no motor.
 */
import { loadDataset } from '../src/data/load';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR } from '../src/domain/roles';
import redditRaw from '../src/data/raw/reddit.roleStats.json';

const data = loadDataset();
type Row = { average?: number; top?: number };
const reddit = redditRaw as unknown as Record<string, Record<string, Row>>;

function pearson(xs: readonly number[], ys: readonly number[]): number {
  const n = xs.length;
  if (n < 3) return Number.NaN;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}

for (const slot of ALL_ROLE_SLOTS) {
  const known = new Map(data.battlepassTopRoles[slot].map((e) => [e.teamId, e.sharedMaps]));
  const rows = Object.entries(reddit[slot])
    .filter(([k]) => !k.startsWith('_'))
    .map(([teamId, row]) => ({
      teamId,
      ratio: (row.top ?? 0) / (row.average ?? 1),
      maps: known.get(teamId) ?? null,
    }))
    .sort((a, b) => a.ratio - b.ratio);

  const paired = rows.filter((r) => r.maps !== null);
  const r = pearson(paired.map((p) => p.ratio), paired.map((p) => p.maps as number));

  console.log(`\n=== ${ROLE_LABEL_PT_BR[slot].toUpperCase()} ===`);
  console.log(`  correlacao razao-x-mapas nos ${paired.length} times com contagem publicada: r = ${r.toFixed(3)}`);
  for (const row of rows) {
    const maps = row.maps === null ? ' (assumido)' : ` (${row.maps} mapas)`;
    const team = data.teams.get(row.teamId)?.name ?? row.teamId;
    console.log(`    ${row.ratio.toFixed(2)}  ${team.padEnd(17)}${maps}`);
  }
}
