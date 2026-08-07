/**
 * O "NUNCA USE FRACTAL" DO GEMINI SE SUSTENTA?
 *
 * A analise dele conclui que Fractal e sempre ruim. Mas ela testa o traco num
 * cenario onde ele NAO PODE ativar: com tudo no Nivel V as tres qualidades sao
 * iguais, e Fractal exige as tres DIFERENTES. Ele avaliou o Fractal justamente
 * onde o Fractal vale zero por definicao.
 *
 * O print do estandarte real do Desleal mostra o oposto: niveis IV/V/III
 * (misturados) e Fractal rendendo +80% num emblema.
 *
 * A pergunta pratica: como a pessoa NAO escolhe qualidade, ela cai com niveis
 * misturados na maior parte do tempo. Nesse mundo, o Fractal ganha?
 */
import { loadDataset } from '../src/data/load';
import { buildContext } from '../src/engine/context';
import { evaluateRoleCandidates } from '../src/engine/optimize';
import { rankTeams } from '../src/engine/teamRanking';
import { scoreBannerPerMap } from '../src/engine/scoreBanner';
import { buildBanner } from '../src/engine/enumerate';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR } from '../src/domain/roles';
import { ALL_TRAIT_IDS, TRAIT_DEFINITIONS } from '../src/domain/emblems';
import type { QualityTier, TraitId } from '../src/domain/emblems';
import { DEFAULT_RULES } from '../src/domain/rules';
import { roleUnitKey } from '../src/domain/roster';
import teamStrengthRaw from '../src/data/raw/teamStrength.json';

const MARKET = teamStrengthRaw.polymarketTitleProbability as unknown as Record<string, number>;
const data = loadDataset();
const ctx = buildContext(data);
const ranking = rankTeams(evaluateRoleCandidates(ctx), data.roleUnits, 'groupStage', MARKET);

const TRAITS: readonly TraitId[] = [...ALL_TRAIT_IDS, 'none'];
const fmt = (v: number) => Math.round(v).toLocaleString('pt-BR');

/** Cenarios de qualidade: o sonho (tudo V) e os realistas (misturados). */
const SCENARIOS: { readonly label: string; readonly tiers: readonly QualityTier[] }[] = [
  { label: 'tudo Nivel V (o cenario do Gemini)', tiers: [5, 5, 5] },
  { label: 'V / IV / III  (misturado, bom)', tiers: [5, 4, 3] },
  { label: 'IV / V / III  (o do Desleal)', tiers: [4, 5, 3] },
  { label: 'III / IV / II (misturado, mediano)', tiers: [3, 4, 2] },
  { label: 'IV / IV / III (dois repetidos)', tiers: [4, 4, 3] },
];

for (const slot of ALL_ROLE_SLOTS) {
  const leader = ranking[slot].teams[0];
  const unit = data.roleUnits.get(roleUnitKey(leader.teamId, slot));
  if (!unit) continue;
  const statIds = leader.bestCandidate.statIds;

  console.log(`\n${'='.repeat(86)}`);
  console.log(`  ${ROLE_LABEL_PT_BR[slot].toUpperCase()} — ${data.teams.get(leader.teamId)?.name}`);
  console.log('='.repeat(86));

  for (const scenario of SCENARIOS) {
    const results: { traits: TraitId[]; total: number }[] = [];
    for (const a of TRAITS) for (const b of TRAITS) for (const c of TRAITS) {
      const traits = [a, b, c];
      const banner = buildBanner(slot, 'groupStage', statIds,
        traits.map((t, i) => ({ quality: scenario.tiers[i], trait: t })));
      results.push({ traits, total: scoreBannerPerMap(banner, unit, DEFAULT_RULES).dist.mean });
    }
    results.sort((x, y) => y.total - x.total);

    const best = results[0];
    const bestWithFractal = results.find((r) => r.traits.includes('fractal'));
    const gap = bestWithFractal ? ((best.total / bestWithFractal.total) - 1) * 100 : 0;
    const fractalIsBest = best.traits.includes('fractal');

    console.log(`\n  ${scenario.label}`);
    console.log(`    melhor arranjo: ${best.traits.map((t) => TRAIT_DEFINITIONS[t].labelPtBr).join(' / ')}  =  ${fmt(best.total)}`);
    if (bestWithFractal) {
      console.log(
        `    melhor COM Fractal: ${bestWithFractal.traits.map((t) => TRAIT_DEFINITIONS[t].labelPtBr).join(' / ')}  =  ${fmt(bestWithFractal.total)}` +
        (fractalIsBest ? '   <== FRACTAL E O OTIMO' : `   (${gap.toFixed(1)}% abaixo)`),
      );
    }
  }
}

console.log('\n' + '='.repeat(86));
console.log('  LEITURA: Fractal exige as TRES qualidades diferentes. Com tudo no Nivel V ele');
console.log('  vale ZERO por definicao — e esse e o unico cenario que a analise do Gemini');
console.log('  testou. Como ninguem ESCOLHE qualidade, o mundo real e o dos niveis');
console.log('  misturados, e e la que a pergunta importa.');
console.log('='.repeat(86) + '\n');
