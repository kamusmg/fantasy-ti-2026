/**
 * QUANTO VALE O PALPITE DE QUEM NAO MEXEU.
 *
 * A tela de Palpites do cliente ja vem PREENCHIDA numa ordem padrao (a semeadura
 * da Valve). Conferido em dois prints independentes — o do Kamus e o do Topson —
 * com a ordem byte a byte identica, o que so acontece se nenhum dos dois tiver
 * tocado na tela.
 *
 * Ou seja: esse arranjo e o palpite efetivo de todo mundo que abriu e nao mexeu.
 * E a regua mais honesta que existe pra medir se a nossa conta serve — melhor que
 * o sorteio, porque a ordem padrao ja carrega a semeadura da Valve, que por si so
 * ja e informacao.
 */
import { loadDataset } from '../src/data/load';
import swiss from '../src/data/generated/swiss.json';
import { BUCKET_LABEL_PT_BR, BUCKET_ORDER, BUCKET_SLOTS } from '../src/engine/swiss';
import type { Bucket } from '../src/engine/swiss';

const data = loadDataset();
const probability = swiss.bucketProbability as Record<string, Record<Bucket, number>>;
const ours = swiss.picks as Record<string, Bucket>;

/**
 * Ordem em que o cliente ja vem preenchido, lida dos prints.
 * Linha 1: 4-0 | 4-1 (x2) | vencedora da eliminatoria (x5)
 * Linha 2: perdedora da eliminatoria (x5) | 1-4 (x2) | 0-4
 */
const DEFAULT_ORDER: readonly string[] = [
  'yandex', 'vision', 'falcons', 'spirit', 'liquid', 'boomboys', 'xtreme', 'og',
  'nigma', 'lgd', 'aurora', 'ironwing', 'vici', 'gamerlegion', 'resilience', 'huligani',
];

const slots: Bucket[] = [];
for (const bucket of BUCKET_ORDER) {
  for (let i = 0; i < BUCKET_SLOTS[bucket]; i += 1) slots.push(bucket);
}

const untouched: Record<string, Bucket> = {};
DEFAULT_ORDER.forEach((teamId, i) => { untouched[teamId] = slots[i]; });

const hits = (picks: Record<string, Bucket>) =>
  Object.entries(picks).reduce((acc, [id, b]) => acc + (probability[id]?.[b] ?? 0), 0);

const randomBaseline = BUCKET_ORDER.reduce((a, b) => a + BUCKET_SLOTS[b] ** 2, 0) / 16;
const untouchedHits = hits(untouched);
const ourHits = hits(ours);

const name = (id: string) => data.teams.get(id)?.name ?? id;

console.log('\n' + '='.repeat(76));
console.log('  A REGUA: quanto vale cada jeito de palpitar');
console.log('='.repeat(76));
console.log(`\n  sorteio puro .................. ${randomBaseline.toFixed(2)} acertos de 16`);
console.log(`  nao mexer (ordem padrao) ...... ${untouchedHits.toFixed(2)}`);
console.log(`  nosso modelo .................. ${ourHits.toFixed(2)}`);
console.log(`\n  ganho sobre nao mexer: ${(((ourHits / untouchedHits) - 1) * 100).toFixed(0)}%`);

console.log('\n' + '-'.repeat(76));
console.log('  ONDE DISCORDAMOS DE QUEM NAO MEXEU');
console.log('-'.repeat(76));
let diffs = 0;
for (const teamId of DEFAULT_ORDER) {
  if (untouched[teamId] === ours[teamId]) continue;
  diffs += 1;
  const pUntouched = probability[teamId][untouched[teamId]];
  const pOurs = probability[teamId][ours[teamId]];
  const better = pOurs > pUntouched ? 'nosso melhor' : 'padrao melhor';
  console.log(
    `  ${name(teamId).padEnd(17)} padrao: ${BUCKET_LABEL_PT_BR[untouched[teamId]].padEnd(27)} ${(pUntouched * 100).toFixed(0).padStart(3)}%`,
  );
  console.log(
    `  ${''.padEnd(17)} nosso:  ${BUCKET_LABEL_PT_BR[ours[teamId]].padEnd(27)} ${(pOurs * 100).toFixed(0).padStart(3)}%   <- ${better}`,
  );
}
console.log(`\n  ${diffs} de 16 times mudam de balde. Nos outros ${16 - diffs} concordamos com a semeadura.`);
console.log('');
