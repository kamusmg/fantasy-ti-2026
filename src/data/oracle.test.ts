import { describe, expect, it } from 'vitest';
import { loadDataset } from './load';
import { battlepassTitleGain, impliedProbability } from './oracle';
import { SUFFIX_DEFINITIONS } from '../domain/titles';
import { prefixLeagueMeans } from '../engine/coach';
import { toRoleScale } from './blend';

/**
 * O TESTE MAIS VALIOSO DA SUITE.
 *
 * Reproduzir os quatro ganhos publicados pelo battlepass valida, de uma vez so:
 * as unidades (divisao por dupla), a mistura das fontes, o modelo de treinador,
 * a regra da media da funcao e a regra dos 2 mapas contados.
 */
describe('oraculo battlepass.ru', () => {
  const data = loadDataset();

  it('reproduz os 4 ganhos publicados com uma unica constante', () => {
    const total = data.seasonAverageRosterTotal;
    const expectedProbability: Record<string, number> = {
      clutch: SUFFIX_DEFINITIONS.clutch.perMapProbability,
      underdog: SUFFIX_DEFINITIONS.underdog.perMapProbability,
      lucky: SUFFIX_DEFINITIONS.lucky.perMapProbability,
      cerulean: 0.325,
    };

    for (const published of data.publishedTitleGains) {
      const p = expectedProbability[published.titleId];
      expect(p, `sem probabilidade modelada pra ${published.titleId}`).toBeDefined();
      const predicted = battlepassTitleGain(published.bonus, p, total);
      const relativeError = Math.abs(predicted - published.gain) / published.gain;
      expect(relativeError, `${published.titleId}: previsto ${predicted.toFixed(0)} vs publicado ${published.gain}`).toBeLessThan(0.02);
    }
  });

  it('as probabilidades implicadas sao mutuamente plausiveis', () => {
    const total = data.seasonAverageRosterTotal;
    const byId = new Map(data.publishedTitleGains.map((g) => [g.titleId, g]));

    // Clutch = exatamente um dos dois mapas contados.
    const clutch = byId.get('clutch');
    expect(clutch).toBeDefined();
    expect(impliedProbability(clutch!.gain, clutch!.bonus, total)).toBeCloseTo(0.5, 1);

    // Sortudo bate com o "~10% das partidas terminam em 8" que eles declaram.
    const lucky = byId.get('lucky');
    expect(impliedProbability(lucky!.gain, lucky!.bonus, total)).toBeGreaterThan(0.08);
    expect(impliedProbability(lucky!.gain, lucky!.bonus, total)).toBeLessThan(0.12);

    // Azarao ~ taxa de derrota, que tem que ficar perto de 50%.
    const underdog = byId.get('underdog');
    expect(impliedProbability(underdog!.gain, underdog!.bonus, total)).toBeGreaterThan(0.45);
    expect(impliedProbability(underdog!.gain, underdog!.bonus, total)).toBeLessThan(0.60);
  });

  /**
   * A validacao cruzada de verdade: a taxa de heroi azul implicada pelo ganho do
   * Ceruleo (fonte: battlepass) tem que bater com a media da NOSSA tabela de
   * frequencia (fonte: Reddit). Duas fontes independentes, mesmo numero.
   */
  it('a taxa de heroi azul do battlepass bate com a tabela do Reddit', () => {
    const total = data.seasonAverageRosterTotal;
    const cerulean = data.publishedTitleGains.find((g) => g.titleId === 'cerulean');
    expect(cerulean).toBeDefined();

    const fromBattlepass = impliedProbability(cerulean!.gain, cerulean!.bonus, total);
    const fromReddit = prefixLeagueMeans(data.players.values()).cerulean;

    expect(Math.abs(fromBattlepass - fromReddit) / fromBattlepass).toBeLessThan(0.15);
  });
});

describe('unidades', () => {
  const data = loadDataset();

  it('o fator de escala por funcao fica perto de 1 (nunca perto de 2 ou 0,5)', () => {
    for (const slot of ['core', 'mid', 'support'] as const) {
      const k = data.diagnostics.scaleFactor[slot];
      expect(k, `escala de ${slot} = ${k.toFixed(3)}`).toBeGreaterThan(0.80);
      expect(k, `escala de ${slot} = ${k.toFixed(3)}`).toBeLessThan(1.30);
    }
  });

  /**
   * A verificacao que confirmou a divisao por 2 com fonte independente:
   * Yuma & Wisper, Teamfight, 2728 / 2 = 1364, contra o Teamfight de Core do
   * battlepass, 1315.
   */
  it('a divisao da dupla bate com o battlepass num caso conhecido', () => {
    const pairSum = 2728;
    const roleScore = toRoleScale(pairSum, 'core');
    const battlepassCoreTeamfight = data.leagueMean.core.teamfight;
    expect(roleScore / battlepassCoreTeamfight).toBeGreaterThan(0.90);
    expect(roleScore / battlepassCoreTeamfight).toBeLessThan(1.15);
  });
});
