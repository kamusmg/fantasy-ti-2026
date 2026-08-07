import type { Emblem, TraitId } from '../domain/emblems';
import { TRAIT_DEFINITIONS } from '../domain/emblems';
import type { ScoringRuleSet } from '../domain/rules';

/**
 * Multiplicador de cada emblema do estandarte.
 *
 * O ponto que faz este arquivo existir: emblemas NAO SAO INDEPENDENTES.
 *   - Benevolente e Vampirico agem nos VIZINHOS
 *   - Fractal depende de todas as qualidades do estandarte serem diferentes
 *   - Unico so vale se for o unico Unico
 *   - Amigavel so vale com 3 ou mais Amigaveis — e um DEGRAU, nao uma rampa
 *
 * Consequencia pratica no conselheiro de rerolls: avaliar emblema a emblema, de
 * forma gulosa, erra o degrau do Amigavel por completo. Com 2 Amigaveis ja rolados
 * na Fase de Grupos (que tem so 3 emblemas), rolar o terceiro pra Amigavel vale
 * +50% em TRES emblemas de uma vez. Por isso toda avaliacao passa por aqui, com
 * o estandarte inteiro na mao.
 *
 * Composicao ADITIVA, fixada por captura de tela do cliente: Tier II (+30%) com
 * um vizinho Vampirico (-10%) aparece como 120%. Aditivo da 100+30-10 = 120;
 * multiplicativo daria 1,30 x 0,90 = 117%.
 */

export function neighborIndices(index: number, length: number, adjacency: 'line' | 'ring'): readonly number[] {
  if (length <= 1) return [];
  if (adjacency === 'ring') {
    const prev = (index - 1 + length) % length;
    const next = (index + 1) % length;
    return prev === next ? [prev] : [prev, next];
  }
  const out: number[] = [];
  if (index - 1 >= 0) out.push(index - 1);
  if (index + 1 < length) out.push(index + 1);
  return out;
}

interface BannerTraitContext {
  readonly allQualitiesDistinct: boolean;
  readonly uniqueCount: number;
  readonly friendlyCount: number;
}

function bannerContext(emblems: readonly Emblem[]): BannerTraitContext {
  const qualities = new Set(emblems.map((e) => e.quality));
  return {
    allQualitiesDistinct: qualities.size === emblems.length,
    uniqueCount: emblems.filter((e) => e.trait === 'unique').length,
    friendlyCount: emblems.filter((e) => e.trait === 'friendly').length,
  };
}

/** O que o traco faz NO PROPRIO emblema, ja resolvido contra o estandarte. */
export function ownTraitBonus(trait: TraitId, ctx: BannerTraitContext): number {
  if (trait === 'fractal') return ctx.allQualitiesDistinct ? TRAIT_DEFINITIONS.fractal.selfBonus : 0;
  if (trait === 'vampiric') return TRAIT_DEFINITIONS.vampiric.selfBonus;
  if (trait === 'unique') return ctx.uniqueCount === 1 ? TRAIT_DEFINITIONS.unique.selfBonus : 0;
  if (trait === 'friendly') return ctx.friendlyCount >= 3 ? TRAIT_DEFINITIONS.friendly.selfBonus : 0;
  return 0; // Benevolente so age nos vizinhos.
}

export interface EmblemBonusBreakdown {
  readonly quality: number;
  readonly ownTrait: number;
  readonly adjacency: number;
  readonly multiplier: number;
}

/**
 * Decomposicao do multiplicador de cada emblema. A tela precisa da decomposicao,
 * nao so do produto — e o que deixa explicar ao vivo por que um emblema vale mais.
 */
export function emblemBonuses(
  emblems: readonly Emblem[],
  rules: ScoringRuleSet,
): readonly EmblemBonusBreakdown[] {
  const ctx = bannerContext(emblems);

  return emblems.map((emblem, index) => {
    const quality = rules.qualityBonus[emblem.quality];
    const ownTrait = ownTraitBonus(emblem.trait, ctx);
    const adjacency = neighborIndices(index, emblems.length, rules.adjacency).reduce(
      (acc, j) => acc + TRAIT_DEFINITIONS[emblems[j].trait].neighborBonus,
      0,
    );

    if (rules.traitComposition === 'multiplicative') {
      return { quality, ownTrait, adjacency, multiplier: (1 + quality) * (1 + ownTrait) * (1 + adjacency) };
    }
    return { quality, ownTrait, adjacency, multiplier: 1 + quality + ownTrait + adjacency };
  });
}

export function emblemMultipliers(emblems: readonly Emblem[], rules: ScoringRuleSet): readonly number[] {
  return emblemBonuses(emblems, rules).map((b) => b.multiplier);
}
