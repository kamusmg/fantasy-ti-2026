import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { emblemBonuses, emblemMultipliers, neighborIndices } from './multipliers';
import type { Emblem, QualityTier, TraitId } from '../domain/emblems';
import { ALL_QUALITY_TIERS, ALL_TRAIT_IDS } from '../domain/emblems';
import { DEFAULT_RULES } from '../domain/rules';

const emblem = (index: number, quality: QualityTier, trait: TraitId): Emblem => ({
  index,
  color: 'red',
  statId: 'gpm',
  quality,
  trait,
});

describe('teste da captura de tela — fixa aditivo vs multiplicativo', () => {
  /**
   * O teste mais decisivo do modelo de tracos. No cliente, um emblema Tier II
   * (+30%) com um vizinho Vampirico (-10%) aparece como 120%.
   *   aditivo:        100 + 30 - 10 = 120  <- e este
   *   multiplicativo: 1,30 x 0,90   = 117
   */
  it('Tier II com vizinho Vampirico da exatamente 1,20', () => {
    const banner = [emblem(0, 2, 'none'), emblem(1, 3, 'vampiric')];
    expect(emblemMultipliers(banner, DEFAULT_RULES)[0]).toBeCloseTo(1.20, 10);
  });

  it('no modo multiplicativo o mesmo caso daria 1,17 — por isso o aditivo vence', () => {
    const banner = [emblem(0, 2, 'none'), emblem(1, 3, 'vampiric')];
    const multiplicative = { ...DEFAULT_RULES, traitComposition: 'multiplicative' as const };
    expect(emblemMultipliers(banner, multiplicative)[0]).toBeCloseTo(1.17, 10);
  });
});

describe('adjacencia', () => {
  it('numa LINHA as pontas tem um vizinho e o meio tem dois', () => {
    expect(neighborIndices(0, 3, 'line')).toEqual([1]);
    expect(neighborIndices(1, 3, 'line')).toEqual([0, 2]);
    expect(neighborIndices(2, 3, 'line')).toEqual([1]);
  });

  /** Por isso Vampirico quer ficar numa PONTA: penaliza so um vizinho. */
  it('Vampirico numa ponta custa menos que no meio', () => {
    const atEnd = [emblem(0, 3, 'vampiric'), emblem(1, 3, 'none'), emblem(2, 3, 'none')];
    const atMiddle = [emblem(0, 3, 'none'), emblem(1, 3, 'vampiric'), emblem(2, 3, 'none')];
    const sum = (b: Emblem[]) => emblemMultipliers(b, DEFAULT_RULES).reduce((a, c) => a + c, 0);
    expect(sum(atEnd)).toBeGreaterThan(sum(atMiddle));
  });
});

describe('tracos que dependem do estandarte inteiro', () => {
  it('Unico vale 0,30 sozinho e ZERO quando ha dois', () => {
    const alone = [emblem(0, 3, 'unique'), emblem(1, 3, 'none'), emblem(2, 3, 'none')];
    const two = [emblem(0, 3, 'unique'), emblem(1, 3, 'unique'), emblem(2, 3, 'none')];
    expect(emblemBonuses(alone, DEFAULT_RULES)[0].ownTrait).toBeCloseTo(0.30, 10);
    expect(emblemBonuses(two, DEFAULT_RULES)[0].ownTrait).toBe(0);
    expect(emblemBonuses(two, DEFAULT_RULES)[1].ownTrait).toBe(0);
  });

  /**
   * O DEGRAU. Com 2 Amigaveis nao vale nada; com 3 vale +50% nos TRES ao mesmo
   * tempo. E por isso que o conselheiro de rerolls nao pode avaliar emblema a
   * emblema de forma gulosa — ele passaria batido por essa jogada.
   */
  it('Amigavel e degrau: zero com dois, +0,50 nos tres com tres', () => {
    const two = [emblem(0, 1, 'friendly'), emblem(1, 2, 'friendly'), emblem(2, 3, 'none')];
    const three = [emblem(0, 1, 'friendly'), emblem(1, 2, 'friendly'), emblem(2, 3, 'friendly')];
    expect(emblemBonuses(two, DEFAULT_RULES).every((b) => b.ownTrait === 0)).toBe(true);
    expect(emblemBonuses(three, DEFAULT_RULES).every((b) => b.ownTrait === 0.50)).toBe(true);
  });

  it('Fractal zera assim que duas qualidades colidem', () => {
    const distinct = [emblem(0, 1, 'fractal'), emblem(1, 2, 'none'), emblem(2, 3, 'none')];
    const collision = [emblem(0, 1, 'fractal'), emblem(1, 2, 'none'), emblem(2, 2, 'none')];
    expect(emblemBonuses(distinct, DEFAULT_RULES)[0].ownTrait).toBeCloseTo(0.60, 10);
    expect(emblemBonuses(collision, DEFAULT_RULES)[0].ownTrait).toBe(0);
  });
});

describe('invariantes (fast-check)', () => {
  const arbEmblem = (index: number) =>
    fc.record({
      quality: fc.constantFrom(...ALL_QUALITY_TIERS),
      trait: fc.constantFrom(...ALL_TRAIT_IDS),
    }).map(({ quality, trait }) => emblem(index, quality, trait));

  const arbBanner = fc
    .tuple(arbEmblem(0), arbEmblem(1), arbEmblem(2))
    .map(([a, b, c]) => [a, b, c]);

  /**
   * ATENCAO — a versao ingenua desta propriedade ("subir qualidade nunca piora")
   * e FALSA, e o fast-check achou o contraexemplo:
   *
   *   [III fractal, II fractal, I fractal] -> sobe o do meio pra III
   *   qualidades viram [3,3,1], deixam de ser todas diferentes, o Fractal
   *   DESLIGA nos tres, e o emblema cai de 1,90 pra 1,60.
   *
   * Consequencia pratica pro conselheiro de rerolls: a opcao "aumente uma
   * qualidade" pode ser NEGATIVA num estandarte com Fractal. Nao existe upgrade
   * automaticamente seguro.
   */
  it('subir a qualidade nunca piora — DESDE QUE nao haja Fractal no estandarte', () => {
    fc.assert(
      fc.property(arbBanner, fc.integer({ min: 0, max: 2 }), (banner, i) => {
        if (banner.some((e) => e.trait === 'fractal')) return true;
        if (banner[i].quality === 5) return true;
        const before = emblemMultipliers(banner, DEFAULT_RULES)[i];
        const raised = banner.map((e, j) =>
          j === i ? { ...e, quality: (e.quality + 1) as QualityTier } : e,
        );
        return emblemMultipliers(raised, DEFAULT_RULES)[i] >= before - 1e-9;
      }),
      { numRuns: 1000 },
    );
  });

  it('com Fractal no estandarte, subir uma qualidade PODE piorar', () => {
    const banner = [emblem(0, 3, 'fractal'), emblem(1, 2, 'fractal'), emblem(2, 1, 'fractal')];
    const before = emblemMultipliers(banner, DEFAULT_RULES)[1];
    const raised = [emblem(0, 3, 'fractal'), emblem(1, 3, 'fractal'), emblem(2, 1, 'fractal')];
    const after = emblemMultipliers(raised, DEFAULT_RULES)[1];
    expect(before).toBeCloseTo(1.90, 10);
    expect(after).toBeCloseTo(1.60, 10);
    expect(after).toBeLessThan(before);
  });

  /**
   * Mesma armadilha do outro lado: trocar um traco por Benevolente parece
   * gratuito, mas se o traco trocado era o TERCEIRO Amigavel, o degrau quebra e
   * os outros dois perdem +50% cada.
   */
  it('Benevolente nunca baixa o vizinho — DESDE QUE nao quebre o degrau do Amigavel', () => {
    fc.assert(
      fc.property(arbBanner, fc.integer({ min: 0, max: 2 }), (banner, i) => {
        const friendlyBefore = banner.filter((e) => e.trait === 'friendly').length;
        const friendlyAfter = banner.filter((e, j) => j !== i && e.trait === 'friendly').length;
        if (friendlyBefore >= 3 && friendlyAfter < 3) return true;
        const withBenevolent = banner.map((e, j) => (j === i ? { ...e, trait: 'benevolent' as TraitId } : e));
        const before = emblemMultipliers(banner, DEFAULT_RULES);
        const after = emblemMultipliers(withBenevolent, DEFAULT_RULES);
        return neighborIndices(i, 3, 'line').every((j) => after[j] >= before[j] - 1e-9);
      }),
      { numRuns: 1000 },
    );
  });

  it('trocar o terceiro Amigavel por Benevolente PIORA os vizinhos', () => {
    const three = [emblem(0, 1, 'friendly'), emblem(1, 1, 'friendly'), emblem(2, 1, 'friendly')];
    const broken = [emblem(0, 1, 'benevolent'), emblem(1, 1, 'friendly'), emblem(2, 1, 'friendly')];
    expect(emblemMultipliers(three, DEFAULT_RULES)[1]).toBeCloseTo(1.60, 10);
    expect(emblemMultipliers(broken, DEFAULT_RULES)[1]).toBeCloseTo(1.30, 10);
  });

  it('nunca produz NaN nem Infinity', () => {
    fc.assert(
      fc.property(arbBanner, (banner) =>
        emblemMultipliers(banner, DEFAULT_RULES).every((m) => Number.isFinite(m)),
      ),
      { numRuns: 1000 },
    );
  });
});
