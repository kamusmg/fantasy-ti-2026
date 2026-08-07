/**
 * QUAL ARRANJO DE TRACOS RENDE MAIS, com tudo no Nivel V?
 *
 * O Gemini propos duas montagens e defendeu uma delas por argumento. Argumento
 * nao decide isso — o espaco e pequeno o bastante pra enumerar inteiro:
 * 6 tracos (5 reais + nenhum) em 3 emblemas = 216 arranjos por estandarte.
 *
 * Roda contra o time recomendado de cada funcao, com a melhor atribuicao de
 * stats, e compara com as propostas dele.
 */
import { loadDataset } from '../src/data/load';
import { buildContext } from '../src/engine/context';
import { evaluateRoleCandidates } from '../src/engine/optimize';
import { rankTeams } from '../src/engine/teamRanking';
import { scoreBannerPerMap } from '../src/engine/scoreBanner';
import { buildBanner } from '../src/engine/enumerate';
import { ALL_ROLE_SLOTS, ROLE_LABEL_PT_BR, byRoleSlot } from '../src/domain/roles';
import { ALL_TRAIT_IDS, TRAIT_DEFINITIONS } from '../src/domain/emblems';
import type { TraitId } from '../src/domain/emblems';
import { STAT_DEFINITIONS } from '../src/domain/stats';
import { DEFAULT_RULES } from '../src/domain/rules';
import { roleUnitKey } from '../src/domain/roster';

const data = loadDataset();
const ctx = buildContext(data);
const ranking = rankTeams(evaluateRoleCandidates(ctx), data.roleUnits, 'groupStage');

/** Inclui 'none' porque nem sempre um traco e melhor que nenhum. */
const TRAITS: readonly TraitId[] = [...ALL_TRAIT_IDS, 'none'];

const fmt = (v: number) => Math.round(v).toLocaleString('pt-BR');

for (const slot of ALL_ROLE_SLOTS) {
  const leader = ranking[slot].teams[0];
  const unit = data.roleUnits.get(roleUnitKey(leader.teamId, slot));
  if (!unit) continue;

  // Melhor atribuicao de stats desta funcao (a que o otimizador ja escolheu).
  const statIds = leader.bestCandidate.statIds;

  const results: { traits: TraitId[]; total: number; perEmblem: number[] }[] = [];

  for (const a of TRAITS) {
    for (const b of TRAITS) {
      for (const c of TRAITS) {
        const traits = [a, b, c];
        const banner = buildBanner(slot, 'groupStage', statIds, traits.map((t) => ({ quality: 5, trait: t })));
        const scored = scoreBannerPerMap(banner, unit, DEFAULT_RULES);
        results.push({
          traits,
          total: scored.dist.mean,
          perEmblem: scored.emblems.map((e) => e.multiplier),
        });
      }
    }
  }

  results.sort((x, y) => y.total - x.total);

  console.log(`\n${'='.repeat(84)}`);
  console.log(`  ${ROLE_LABEL_PT_BR[slot].toUpperCase()} — ${data.teams.get(leader.teamId)?.name}`);
  console.log(`  estandarte: ${statIds.map((s) => STAT_DEFINITIONS[s].labelPtBr).join(' / ')}`);
  console.log(`  ${results.length} arranjos de traco testados, tudo no Nivel V`);
  console.log('='.repeat(84));

  console.log('\n  TOP 5:');
  for (const r of results.slice(0, 5)) {
    const names = r.traits.map((t) => TRAIT_DEFINITIONS[t].labelPtBr.padEnd(12)).join(' ');
    const mults = r.perEmblem.map((m) => `${((m - 1) * 100).toFixed(0)}%`.padStart(5)).join(' ');
    console.log(`    ${fmt(r.total).padStart(6)}  ${names}  bonus: ${mults}`);
  }

  const worst = results[results.length - 1];
  console.log(`\n  pior arranjo: ${fmt(worst.total)} (${worst.traits.map((t) => TRAIT_DEFINITIONS[t].labelPtBr).join('/')})`);
  console.log(`  espaco entre melhor e pior: ${(((results[0].total / worst.total) - 1) * 100).toFixed(1)}%`);

  // Propostas do Gemini
  const proposals: Record<string, TraitId[]> = {
    core: ['friendly', 'friendly', 'friendly'],
    mid: ['benevolent', 'vampiric', 'benevolent'],
    support: ['vampiric', 'benevolent', 'vampiric'],
  };
  const proposed = proposals[slot];
  if (proposed) {
    const found = results.find((r) => r.traits.join() === proposed.join());
    const rank = results.findIndex((r) => r.traits.join() === proposed.join()) + 1;
    if (found) {
      const gap = ((results[0].total / found.total) - 1) * 100;
      console.log(
        `\n  proposta do Gemini (${proposed.map((t) => TRAIT_DEFINITIONS[t].labelPtBr).join('/')}): ` +
        `${fmt(found.total)} — ${rank}o de ${results.length}` +
        (gap < 0.01 ? '  <= E O OTIMO' : `, ${gap.toFixed(1)}% abaixo do otimo`),
      );
    }
  }
}
