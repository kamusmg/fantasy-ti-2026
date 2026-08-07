/**
 * OS PALPITES — jogo SEPARADO do Dota dos Sonhos.
 *
 * Encaixa os 16 times em 4-0 (1 vaga), 4-1 (2), Vencedora da Eliminatoria (5),
 * Perdedora (5), 1-4 (2) e 0-4 (1), maximizando acertos esperados.
 */
import strength from '../src/data/raw/teamStrength.json';
import { loadDataset } from '../src/data/load';
import {
  BUCKET_LABEL_PT_BR, BUCKET_ORDER, BUCKET_SLOTS,
  assignPredictions, calibrateTemperature, ratingsFromMarket, simulateSwiss,
} from '../src/engine/swiss';

const data = loadDataset();
const ratings = ratingsFromMarket(strength.polymarketTitleProbability);

/** Alvo de calibracao: chance do melhor bater o pior numa serie Bo3. */
const BEST_VS_WORST = 0.85;
const temperature = calibrateTemperature(ratings, BEST_VS_WORST);

const sim = simulateSwiss(ratings, temperature, 50_000);
const picks = assignPredictions(sim.bucketProbability);

const name = (id: string) => data.teams.get(id)?.name ?? id;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

console.log('\n' + '='.repeat(78));
console.log('  PALPITES — FASE DE GRUPOS TI 2026');
console.log(`  ${sim.iterations.toLocaleString('pt-BR')} simulacoes do Suico  ·  encerra em 5 dias`);
console.log('='.repeat(78));

let expectedHits = 0;
for (const bucket of BUCKET_ORDER) {
  const teams = Object.entries(picks).filter(([, b]) => b === bucket).map(([id]) => id);
  console.log(`\n  ${BUCKET_LABEL_PT_BR[bucket].toUpperCase()}  (${BUCKET_SLOTS[bucket]} vaga${BUCKET_SLOTS[bucket] > 1 ? 's' : ''})`);
  for (const id of teams) {
    const p = sim.bucketProbability[id][bucket];
    expectedHits += p;
    console.log(`     ${name(id).padEnd(18)} ${pct(p).padStart(6)} de chance`);
  }
}

console.log('\n' + '-'.repeat(78));
console.log(`  ACERTOS ESPERADOS: ${expectedHits.toFixed(1)} de 16`);
console.log('-'.repeat(78));

console.log('\n  MATRIZ COMPLETA — probabilidade de cada time em cada balde\n');
console.log('  TIME                4-0    4-1   ELIM+  ELIM-    1-4    0-4   series');
console.log('  ' + '-'.repeat(74));
const ordered = [...Object.keys(sim.bucketProbability)].sort(
  (a, b) => (sim.bucketProbability[b]['4-0'] + sim.bucketProbability[b]['4-1'])
          - (sim.bucketProbability[a]['4-0'] + sim.bucketProbability[a]['4-1']),
);
for (const id of ordered) {
  const row = sim.bucketProbability[id];
  const chosen = picks[id];
  const cells = BUCKET_ORDER.map((b) => {
    const s = (row[b] * 100).toFixed(1).padStart(5);
    return b === chosen ? `[${s}]` : ` ${s} `;
  }).join('');
  console.log(`  ${name(id).padEnd(18)}${cells}  ${sim.expectedSeries[id].toFixed(2)}`);
}

console.log('\n  [x] = a vaga escolhida pelo algoritmo de atribuicao.');
console.log(`  Calibracao: melhor vs pior = ${pct(BEST_VS_WORST)} por serie (temperatura ${temperature.toFixed(2)}).`);

console.log('\n' + '-'.repeat(78));
console.log('  SENSIBILIDADE — quais palpites AGUENTAM mudar a calibracao?');
console.log('-'.repeat(78));

const stability = new Map<string, number>();
const targets = [0.75, 0.80, 0.85, 0.90, 0.95];
for (const target of targets) {
  const t = calibrateTemperature(ratings, target);
  const alt = assignPredictions(simulateSwiss(ratings, t, 20_000).bucketProbability);
  for (const id of Object.keys(picks)) {
    if (alt[id] === picks[id]) stability.set(id, (stability.get(id) ?? 0) + 1);
  }
  const champ = Object.entries(alt).find(([, b]) => b === '4-0')?.[0];
  const zero = Object.entries(alt).find(([, b]) => b === '0-4')?.[0];
  console.log(`  melhor-vs-pior ${pct(target).padStart(6)}:  4-0 = ${name(champ ?? '').padEnd(16)} 0-4 = ${name(zero ?? '')}`);
}

console.log('\n  ESTABILIDADE POR TIME (em quantas das 5 calibracoes o palpite se mantem)\n');
const sorted = [...Object.keys(picks)].sort((a, b) => (stability.get(b) ?? 0) - (stability.get(a) ?? 0));
for (const id of sorted) {
  const s = stability.get(id) ?? 0;
  const mark = s === targets.length ? 'FIRME  ' : s >= 3 ? 'ok     ' : 'CHUTE  ';
  console.log(`    ${mark} ${name(id).padEnd(18)} ${BUCKET_LABEL_PT_BR[picks[id]].padEnd(28)} ${s}/${targets.length}`);
}

const firm = sorted.filter((id) => (stability.get(id) ?? 0) === targets.length).length;
console.log(`\n  ${firm} de 16 palpites aguentam qualquer calibracao. O resto e chute educado —`);
console.log('  e assumir isso vale mais do que fingir confianca em 16 acertos.\n');
