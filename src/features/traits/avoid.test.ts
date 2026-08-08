import { describe, expect, it } from 'vitest';
import { activeAvoids } from './TraitsScene';
import type { Slot } from './TraitsScene';

/**
 * O painel "Evite" acende sozinho conforme o estandarte montado logo acima.
 *
 * Acender errado nao quebra nada visivelmente — a tela continua bonita e ensina
 * a coisa errada em 1920x1080. Por isso as quatro regras sao testadas contra o
 * caso em que elas NAO devem acender, que e onde um `>=` no lugar de `>` passa.
 */
const banner = (...slots: readonly [number, string][]): Slot[] =>
  slots.map(([quality, trait]) => ({ quality, trait } as Slot));

describe('activeAvoids', () => {
  it('Amigavel incompleto acende com 1 ou 2, e nao com 0 nem com 3', () => {
    expect(activeAvoids(banner([1, 'friendly'], [2, 'fractal'], [3, 'fractal'])))
      .toContain('friendlyIncomplete');
    expect(activeAvoids(banner([1, 'friendly'], [2, 'friendly'], [3, 'fractal'])))
      .toContain('friendlyIncomplete');

    expect(activeAvoids(banner([1, 'fractal'], [2, 'fractal'], [3, 'fractal'])))
      .not.toContain('friendlyIncomplete');
    // Os TRES: e a montagem de maior teto, nao um erro.
    expect(activeAvoids(banner([1, 'friendly'], [2, 'friendly'], [3, 'friendly'])))
      .not.toContain('friendlyIncomplete');
  });

  it('dois Unicos acendem, um Unico so nao', () => {
    expect(activeAvoids(banner([1, 'unique'], [2, 'unique'], [3, 'fractal'])))
      .toContain('twoUniques');
    expect(activeAvoids(banner([1, 'unique'], [2, 'fractal'], [3, 'fractal'])))
      .not.toContain('twoUniques');
  });

  it('Fractal so acende com nivel repetido, e so se houver Fractal', () => {
    expect(activeAvoids(banner([2, 'fractal'], [2, 'benevolent'], [3, 'unique'])))
      .toContain('fractalRepeated');
    // Niveis repetidos SEM Fractal no estandarte nao sao erro nenhum.
    expect(activeAvoids(banner([2, 'benevolent'], [2, 'unique'], [3, 'vampiric'])))
      .not.toContain('fractalRepeated');
    expect(activeAvoids(banner([1, 'fractal'], [2, 'fractal'], [3, 'fractal'])))
      .not.toContain('fractalRepeated');
  });

  it('Vampirico acende no meio e nao nas pontas', () => {
    expect(activeAvoids(banner([1, 'fractal'], [2, 'vampiric'], [3, 'fractal'])))
      .toContain('vampiricMiddle');
    expect(activeAvoids(banner([1, 'vampiric'], [2, 'fractal'], [3, 'fractal'])))
      .not.toContain('vampiricMiddle');
    expect(activeAvoids(banner([1, 'fractal'], [2, 'fractal'], [3, 'vampiric'])))
      .not.toContain('vampiricMiddle');
  });

  it('o estandarte real do NS_Art acende exatamente dois erros', () => {
    // Suporte dele: Fractal V, Unico I, Unico IV -> dois Unicos, e nada mais.
    const support = banner([5, 'fractal'], [1, 'unique'], [4, 'unique']);
    expect([...activeAvoids(support)].sort()).toEqual(['twoUniques']);

    // Meio dele: Fractal III, Fractal IV, Vampirico V -> nenhum erro.
    const mid = banner([3, 'fractal'], [4, 'fractal'], [5, 'vampiric']);
    expect([...activeAvoids(mid)]).toEqual([]);
  });
});
