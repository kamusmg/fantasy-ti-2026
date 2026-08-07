import { describe, expect, it } from 'vitest';
import { emblemMultipliers } from './multipliers';
import type { Emblem, QualityTier, TraitId } from '../domain/emblems';
import type { EmblemColor, StatId } from '../domain/stats';
import { DEFAULT_RULES } from '../domain/rules';
import dreamTeams from '../data/raw/dreamTeams.json';

/**
 * TESTE-OURO: as porcentagens do CLIENTE DE VERDADE.
 *
 * Print do estandarte do Desleal Dota, com os nove emblemas dos tres
 * estandartes. Cada caixa do cliente mostra:
 *
 *     total% = 100 + nivel% + traco_liquido%
 *
 * onde o traco liquido e o efeito PROPRIO mais o dos VIZINHOS. Bater os nove de
 * uma vez valida, junto: composicao aditiva, adjacencia em linha, a condicao de
 * qualidades distintas do Fractal, a condicao de unicidade do Unico, e o
 * +50/-10 do Vampirico.
 *
 * A prova mais forte esta no Meio: o MESMO traco Fractal rende +80% no Core e
 * +20% no Meio — porque no Core os niveis sao IV/V/III (todos distintos, Fractal
 * liga) e no Meio sao III/V/III (repetidos, Fractal desliga e sobra so o +20 do
 * vizinho Benevolente). Nenhum modelo errado acerta esses dois numeros juntos.
 */

const LAYOUT: Record<string, readonly EmblemColor[]> = {
  core: ['red', 'green', 'red'],
  mid: ['red', 'blue', 'green'],
  support: ['blue', 'green', 'blue'],
};

interface ClientEmblem {
  readonly stat: string;
  readonly quality: number;
  readonly trait: string;
  readonly clientTotal: number;
}

describe('estandarte real do cliente (print do Desleal Dota)', () => {
  const desleal = dreamTeams.authors.find((a) => a.id === 'desleal');
  const banner = desleal?.bannerFromScreenshot as Record<string, ClientEmblem[]> | undefined;

  it('o print esta registrado nos dados', () => {
    expect(banner, 'bannerFromScreenshot ausente em dreamTeams.json').toBeDefined();
  });

  for (const slot of ['core', 'mid', 'support'] as const) {
    it(`reproduz as tres porcentagens do ${slot}`, () => {
      const rows = banner?.[slot];
      expect(rows).toHaveLength(3);
      if (!rows) return;

      const emblems: Emblem[] = rows.map((row, index) => ({
        index,
        color: LAYOUT[slot][index],
        statId: row.stat as StatId,
        quality: row.quality as QualityTier,
        trait: row.trait as TraitId,
      }));

      const multipliers = emblemMultipliers(emblems, DEFAULT_RULES);

      rows.forEach((row, i) => {
        const ours = Math.round(multipliers[i] * 100);
        expect(ours, `${slot}[${i}] ${row.stat}: cliente ${row.clientTotal}%, motor ${ours}%`)
          .toBe(row.clientTotal);
      });
    });
  }

  /** O caso que separa modelo certo de modelo errado. */
  it('Fractal rende +80% no Core e +20% no Meio pelo mesmo motivo', () => {
    const core = banner?.core;
    const mid = banner?.mid;
    expect(core?.[0].clientTotal).toBe(280);
    expect(mid?.[0].clientTotal).toBe(180);

    // Core: niveis IV/V/III sao todos distintos -> Fractal LIGA.
    expect(new Set(core?.map((r) => r.quality)).size).toBe(3);
    // Meio: niveis III/V/III se repetem -> Fractal DESLIGA.
    expect(new Set(mid?.map((r) => r.quality)).size).toBeLessThan(3);
  });

  /**
   * Adjacencia e LINHA, nao anel. No Suporte o emblema 1 (Unico) mostra +50% =
   * +30 proprio +20 do vizinho Benevolente. Se fosse anel, levaria tambem o -10%
   * do Vampirico do emblema 3 e daria +40%.
   */
  it('a adjacencia e linha: as pontas do Suporte nao se enxergam', () => {
    expect(banner?.support[0].clientTotal).toBe(300);
    expect(DEFAULT_RULES.adjacency).toBe('line');
  });
});
