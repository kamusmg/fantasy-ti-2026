import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { loadDataset } from '../data/load';
import { buildContext } from './context';
import { evaluateRoleCandidates, optimizeFromCandidates, optimizeLineup, prefixFactorByTeam } from './optimize';
import type { RoleCandidate } from './optimize';
import { expectedScore } from './objectives';
import { ALL_ROLE_SLOTS, byRoleSlot } from '../domain/roles';
import { ALL_PREFIX_IDS, ALL_SUFFIX_IDS, SUFFIX_DEFINITIONS } from '../domain/titles';
import { createRng } from './math/rng';
import { aggregatePeriod, aggregateSeries, DEFAULT_SERIES_SHAPE, GROUP_STAGE_SCHEDULE } from './aggregate';
import { distributionFromMoments } from '../domain/results';
import { DEFAULT_RULES } from '../domain/rules';

const data = loadDataset();
const ctx = buildContext(data);
const candidates = evaluateRoleCandidates(ctx);

describe('espaco de busca', () => {
  it('enumera 9.216 candidatos na Fase de Grupos', () => {
    const counts = ALL_ROLE_SLOTS.map((s) => candidates[s].length);
    // Core 16x180, Meio 16x216, Suporte 16x180
    expect(counts).toEqual([2880, 3456, 2880]);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(9216);
  });
});

/**
 * A separabilidade do laco externo de prefixo NAO e heuristica — e um teorema, e
 * este teste e a prova empirica dele. Com o titulo fixado, o ganho entra como
 * fator linear por funcao, entao o maximo do produto e o produto dos maximos.
 *
 * Comparado contra a forca bruta do produto completo numa instancia reduzida
 * (os 5 melhores candidatos por funcao = 5x5x5x64 = 8.000 combinacoes).
 */
describe('exatidao do otimizador', () => {
  it('o laco externo de prefixo iguala a forca bruta do produto completo', () => {
    const reduced = byRoleSlot<readonly RoleCandidate[]>((slot) =>
      [...candidates[slot]].sort((a, b) => b.perPeriod.mean - a.perPeriod.mean).slice(0, 5),
    );

    const viaSeparability = optimizeFromCandidates(reduced, ctx, expectedScore, 1)[0];

    const prefixFactors = prefixFactorByTeam(ctx);
    let bruteBest = Number.NEGATIVE_INFINITY;
    let bruteTeams = '';

    for (const prefix of ALL_PREFIX_IDS) {
      for (const suffix of ALL_SUFFIX_IDS) {
        for (const core of reduced.core) {
          for (const mid of reduced.mid) {
            for (const support of reduced.support) {
              let total = 0;
              for (const [slot, c] of [['core', core], ['mid', mid], ['support', support]] as const) {
                const def = SUFFIX_DEFINITIONS[suffix];
                const p = def.probabilityBasis === 'team-dependent'
                  ? ctx.titleContext.lossProbabilityByRole[slot]
                  : def.perMapProbability;
                const factor = (prefixFactors[`${c.teamId}:${slot}:${prefix}`] ?? 0) + def.bonus * p;
                total += c.perPeriod.mean * (1 + factor);
              }
              if (total > bruteBest) {
                bruteBest = total;
                bruteTeams = `${core.teamId}/${mid.teamId}/${support.teamId}/${prefix}/${suffix}`;
              }
            }
          }
        }
      }
    }

    const viaTeams = ALL_ROLE_SLOTS.map((s) => viaSeparability.perRole[s].teamId).join('/')
      + `/${viaSeparability.title.prefix}/${viaSeparability.title.suffix}`;

    expect(viaSeparability.total.mean).toBeCloseTo(bruteBest, 6);
    expect(viaTeams).toBe(bruteTeams);
  });
});

describe('guarda de NaN — a pior falha possivel numa transmissao ao vivo', () => {
  it('a enumeracao completa nao produz nenhum NaN nem Infinity', () => {
    for (const slot of ALL_ROLE_SLOTS) {
      for (const c of candidates[slot]) {
        for (const dist of [c.perMap, c.perSeries, c.perPeriod]) {
          for (const [key, value] of Object.entries(dist)) {
            expect(Number.isFinite(value), `${slot} ${c.teamId} ${key} = ${value}`).toBe(true);
          }
        }
      }
    }
  });

  it('nenhum Estimate carrega valor nao finito', () => {
    for (const unit of data.roleUnits.values()) {
      for (const [statId, est] of Object.entries(unit.perMapStat)) {
        expect(Number.isFinite(est.mean), `${unit.teamId}:${unit.slot} ${statId} mean`).toBe(true);
        expect(Number.isFinite(est.sd), `${unit.teamId}:${unit.slot} ${statId} sd`).toBe(true);
        expect(Number.isFinite(est.shrinkWeight)).toBe(true);
        expect(est.shrinkWeight).toBeGreaterThanOrEqual(0);
        expect(est.shrinkWeight).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('determinismo — numero que oscila entre takes destroi a credibilidade', () => {
  it('a mesma entrada da a mesma escalacao, bit a bit', () => {
    const a = optimizeLineup(buildContext(loadDataset()), expectedScore, 3);
    const b = optimizeLineup(buildContext(loadDataset()), expectedScore, 3);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('o gerador com semente repete a sequencia exata', () => {
    const seq = (seed: number) => Array.from({ length: 8 }, () => createRng(seed).next());
    expect(createRng(42).next()).toBe(createRng(42).next());
    expect(seq(1)).toEqual(seq(1));
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });

  it('engine/ nao usa Math.random nem Date.now', () => {
    // Tira comentarios antes de varrer: o proprio rng.ts documenta que essas
    // funcoes sao proibidas, e um alarme que acusa a propria documentacao e um
    // alarme que ensina a ignorar alarmes.
    const stripComments = (source: string): string =>
      source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (!entry.endsWith('.ts') || entry.endsWith('.test.ts')) continue;
        if (/Math\.random|Date\.now|new Date\(\)/.test(stripComments(readFileSync(full, 'utf8')))) {
          offenders.push(full);
        }
      }
    };
    walk(import.meta.dirname);
    expect(offenders).toEqual([]);
  });
});

/**
 * A correcao de ~30% que o battlepass nao faz. Se este teste falhar, os totais da
 * tela estao errados e — pior — o ranking entre stats de alta e baixa variancia
 * esta invertido.
 */
describe('estatistica de ordem', () => {
  it('2-melhores-de-3 rende 2mu + 0,8463 sigma', () => {
    const perMap = distributionFromMoments(3000, 900);
    const shape = { mapCountDistribution: new Map<2 | 3, number>([[3, 1]]) };
    const series = aggregateSeries(perMap, shape, DEFAULT_RULES);
    expect(series.mean).toBeCloseTo(2 * 3000 + 0.846284 * 900, 3);
  });

  it('uma varredura 2-0 tem MAIS variancia guardada que uma serie de 3 mapas', () => {
    const perMap = distributionFromMoments(3000, 900);
    const sweep = aggregateSeries(perMap, { mapCountDistribution: new Map<2 | 3, number>([[2, 1]]) }, DEFAULT_RULES);
    const full = aggregateSeries(perMap, { mapCountDistribution: new Map<2 | 3, number>([[3, 1]]) }, DEFAULT_RULES);
    expect(sweep.sd).toBeGreaterThan(full.sd);
    expect(sweep.mean).toBeLessThan(full.mean);
  });

  it('somar medias subestima o periodo em ~30%', () => {
    const perMap = distributionFromMoments(3000, 900);
    const series = aggregateSeries(perMap, DEFAULT_SERIES_SHAPE, DEFAULT_RULES);
    const period = aggregatePeriod(series, GROUP_STAGE_SCHEDULE, DEFAULT_RULES);
    const naive = 2 * 3000;
    expect(period.mean / naive).toBeGreaterThan(1.25);
    expect(period.mean / naive).toBeLessThan(1.40);
  });

  it('eliminacao (K=0) zera a funcao, e nao "quase zero"', () => {
    const series = distributionFromMoments(7000, 800);
    const out = aggregatePeriod(series, { seriesCountDistribution: new Map([[0, 1]]) }, DEFAULT_RULES);
    expect(out.mean).toBe(0);
  });
});
