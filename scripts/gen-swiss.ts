/**
 * Pre-computa o Suico num JSON.
 *
 * Poderia rodar no navegador, mas 50 mil simulacoes custam segundos — e segundo
 * parado no meio de uma live e caro. Pre-computado fica instantaneo, e como o
 * gerador tem semente fixa o arquivo e reproduzivel: rodar de novo da byte a byte
 * o mesmo resultado.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import strength from '../src/data/raw/teamStrength.json';
import {
  assignPredictions, calibrateTemperature, ratingsFromMarket, simulateSwiss,
} from '../src/engine/swiss';
import type { Bucket } from '../src/engine/swiss';

const BEST_VS_WORST = 0.85;
const CALIBRATIONS = [0.75, 0.80, 0.85, 0.90, 0.95];

const ratings = ratingsFromMarket(strength.polymarketTitleProbability);
const temperature = calibrateTemperature(ratings, BEST_VS_WORST);
const sim = simulateSwiss(ratings, temperature, 50_000);
const picks = assignPredictions(sim.bucketProbability);

// Estabilidade: em quantas calibracoes o palpite se mantem.
const stability: Record<string, number> = {};
for (const id of Object.keys(picks)) stability[id] = 0;
for (const target of CALIBRATIONS) {
  const alt = assignPredictions(
    simulateSwiss(ratings, calibrateTemperature(ratings, target), 20_000).bucketProbability,
  );
  for (const id of Object.keys(picks)) {
    if (alt[id] === picks[id]) stability[id] += 1;
  }
}

const output = {
  _meta: {
    generatedAt: '2026-08-07',
    iterations: sim.iterations,
    temperature,
    bestVsWorstTarget: BEST_VS_WORST,
    calibrationsTested: CALIBRATIONS,
    fonte: 'forca de time do Polymarket (teamStrength.json), semente fixa 20260813',
    nota: 'Reproduzivel: rodar scripts/gen-swiss.ts de novo da exatamente este arquivo.',
  },
  bucketProbability: sim.bucketProbability,
  expectedSeries: sim.expectedSeries,
  picks: picks as Record<string, Bucket>,
  stability,
  maxStability: CALIBRATIONS.length,
};

const path = join(import.meta.dirname, '..', 'src', 'data', 'generated', 'swiss.json');
writeFileSync(path, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`escrito: ${path}`);
console.log(`  ${Object.keys(picks).length} times, ${sim.iterations.toLocaleString('pt-BR')} simulacoes`);
console.log(`  firmes: ${Object.values(stability).filter((s) => s === CALIBRATIONS.length).length}/16`);
