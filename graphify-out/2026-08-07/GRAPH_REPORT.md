# Graph Report - fantasy  (2026-08-07)

## Corpus Check
- 87 files · ~49,607 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 601 nodes · 1369 edges · 33 communities (31 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `68a33efd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- optimize.ts
- roles.ts
- swiss.ts
- strings.ts
- useEngine.ts
- devDependencies
- blend.ts
- RoleSlot
- compilerOptions
- Cola do Fantasy — The International 2026
- compilerOptions
- load.ts
- schema.ts
- fetch-portraits.mjs
- Corpo do post
- answer.ts
- stats.ts
- plugins
- Glossário Oficial de Pontuação - Fantasy TI 2026
- 💻 SUA MISSÃO AGORA (A IMPLEMENTAÇÃO NO REACT)
- 🏆 Equipe dos Sonhos (Dream Team) - O Min-Max Matemático do TI 2026
- Guia Fantasy – Função + Ranking de Atributos (Atualizado TI 2026)
- optimize-images.mjs
- quantile-sweep.ts
- ROLE_LABEL_PT_BR
- team-ranking.ts
- Publicar
- gen-social.mjs
- schedule-bias.ts
- fantasy
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `RoleSlot` - 39 edges
2. `loadDataset()` - 27 edges
3. `ALL_ROLE_SLOTS` - 24 edges
4. `StatId` - 24 edges
5. `evaluateRoleCandidates()` - 20 edges
6. `compilerOptions` - 19 edges
7. `ScoringRuleSet` - 15 edges
8. `compilerOptions` - 15 edges
9. `DataWarning` - 14 edges
10. `byRoleSlot()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `DreamScene()` --indirect_call--> `n()`  [INFERRED]
  src/features/dream/DreamScene.tsx → scripts/report.ts
- `PredictionsScene()` --indirect_call--> `n()`  [INFERRED]
  src/features/predictions/PredictionsScene.tsx → scripts/report.ts
- `leaderAt()` --calls--> `byRoleSlot()`  [EXTRACTED]
  scripts/series-sensitivity.ts → src/domain/roles.ts
- `leaderAt()` --calls--> `buildContext()`  [EXTRACTED]
  scripts/series-sensitivity.ts → src/engine/context.ts
- `leaderAt()` --calls--> `evaluateRoleCandidates()`  [EXTRACTED]
  scripts/series-sensitivity.ts → src/engine/optimize.ts

## Import Cycles
- None detected.

## Communities (33 total, 2 thin omitted)

### Community 0 - "optimize.ts"
Cohesion: 0.07
Nodes (57): Banner, addIndependent(), distributionFromMoments(), EmblemContribution, RoleAssignment, scaleDistribution(), ScoreDistribution, Player (+49 more)

### Community 1 - "roles.ts"
Cohesion: 0.08
Nodes (45): ctx, data, ranking, TRAITS, ALL_QUALITY_TIERS, ALL_TRAIT_IDS, BannerPlan, Emblem (+37 more)

### Community 2 - "swiss.ts"
Cohesion: 0.06
Nodes (44): CALIBRATIONS, output, path, picks, ratings, sim, stability, temperature (+36 more)

### Community 3 - "strings.ts"
Cohesion: 0.07
Nodes (39): react, n(), Scene, Shell(), DreamScene(), LOCK_AT, RoleCard(), useCountdown() (+31 more)

### Community 4 - "useEngine.ts"
Cohesion: 0.09
Nodes (36): byLeverage, ctx, data, ranking, scores, teams, tieRoles, { title, gain } (+28 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (38): fast-check, oxlint, dependencies, react, react-dom, zod, devDependencies, fast-check (+30 more)

### Community 6 - "blend.ts"
Cohesion: 0.12
Nodes (28): data, flagged, report, blend(), calibrateSampleSize(), computeScaleFactor(), estimateSampleMaps(), mean() (+20 more)

### Community 7 - "RoleSlot"
Cohesion: 0.14
Nodes (25): data, auditDataset(), AuditReport, OracleCheck, reproduceTopRoleScore(), StatResidual, TopRoleCheck, BlendDiagnostics (+17 more)

### Community 8 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+17 more)

### Community 9 - "Cola do Fantasy — The International 2026"
Cohesion: 0.09
Nodes (20): A resposta curta, Cola do Fantasy — The International 2026, Como o motor decide, Duas armadilhas de nome que custam caro, How the engine decides, Licence, Running it, The data (+12 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (19): vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit (+11 more)

### Community 11 - "load.ts"
Cohesion: 0.21
Nodes (13): collectSampleMaps(), collectTopRatios(), loadDataset(), parseTopRoles(), statColumnsOnly(), battlepassLeagueSchema, battlepassTopRolesSchema, parseOrThrow() (+5 more)

### Community 12 - "schema.ts"
Cohesion: 0.15
Nodes (11): BattlepassLeague, BattlepassTopRoles, finite, leagueStatRecord, nonNegative, positionSchema, PrefixFrequencyFile, prefixFrequencyRecord (+3 more)

### Community 13 - "fetch-portraits.mjs"
Cohesion: 0.17
Nodes (7): ALIASES, manifest, OPENDOTA_TEAM_ID, OUT_PLAYERS, OUT_TEAMS, ROOT, unmatched

### Community 14 - "Corpo do post"
Cohesion: 0.18
Nodes (10): 1. With Fractal on your banner, raising a quality can LOWER your score, 2. Only your BEST series counts — and that breaks how everyone is doing the math, 3. You don't choose your stats. So the fight isn't the team — it's the tokens., Corpo do post, Full disclosure, How the numbers are built (and where they come from), Notas de postagem, Post para r/DotA2 (+2 more)

### Community 15 - "answer.ts"
Cohesion: 0.18
Nodes (9): candidates, ctx, data, ranked, sameTeams, t0, totalCandidates, CONSERVATIVE (+1 more)

### Community 16 - "stats.ts"
Cohesion: 0.20
Nodes (7): data, RECOMMENDED, COLOR_LABEL_PT_BR, ScoringRule, StatDefinition, STATS_BY_COLOR, colorConcentration()

### Community 17 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 18 - "Glossário Oficial de Pontuação - Fantasy TI 2026"
Cohesion: 0.25
Nodes (7): Emblemas Azuis, Emblemas Verdes, Emblemas Vermelhos, Glossário Oficial de Pontuação - Fantasy TI 2026, Modificadores de Qualidade (Tier), Traços dos Emblemas (Sufixos/Efeitos), Valores Base de Atributos

### Community 19 - "💻 SUA MISSÃO AGORA (A IMPLEMENTAÇÃO NO REACT)"
Cohesion: 0.29
Nodes (6): 1. Corrigir o "Seu" Dream Team (Claude), 2. Implementar os Dados da Equipe dos Sonhos (Dream Team), 3. Regras de Código e Arquitetura do Projeto, 🚀 HANDOFF: INSTRUÇÕES DE ARQUITETURA E LÓGICA (DE GEMINI PARA CLAUDE OPUS), 📂 O QUE EU JÁ FIZ (O SEU PONTO DE PARTIDA), 💻 SUA MISSÃO AGORA (A IMPLEMENTAÇÃO NO REACT)

### Community 20 - "🏆 Equipe dos Sonhos (Dream Team) - O Min-Max Matemático do TI 2026"
Cohesion: 0.33
Nodes (5): 🏆 Equipe dos Sonhos (Dream Team) - O Min-Max Matemático do TI 2026, 🧙‍♂️ MEIO (MID), ⚔️ PRINCIPAL (CORE), Resumo de Reroll para o Claude (Instrução):, 🛡️ SUPORTE

### Community 21 - "Guia Fantasy – Função + Ranking de Atributos (Atualizado TI 2026)"
Cohesion: 0.33
Nodes (5): CORE, Guia Fantasy – Função + Ranking de Atributos (Atualizado TI 2026), MID, Notas de Estratégia para a IA:, SUPPORT

### Community 22 - "optimize-images.mjs"
Cohesion: 0.33
Nodes (4): JOBS, manifest, manifestPath, ROOT

### Community 23 - "quantile-sweep.ts"
Cohesion: 0.33
Nodes (3): candidates, ctx, data

### Community 24 - "ROLE_LABEL_PT_BR"
Cohesion: 0.33
Nodes (4): data, reddit, Row, ROLE_LABEL_PT_BR

### Community 25 - "team-ranking.ts"
Cohesion: 0.33
Nodes (4): candidates, ctx, data, STAT_DEFINITIONS

### Community 26 - "Publicar"
Cohesion: 0.40
Nodes (4): 1. Direto pelo terminal, 2. Conectado ao GitHub (recomendado), Publicar, Se quiser outro nome

### Community 27 - "gen-social.mjs"
Cohesion: 0.40
Nodes (3): answer, PUBLIC, ROOT

### Community 28 - "schedule-bias.ts"
Cohesion: 0.40
Nodes (4): data, reddit, Row, ALL_STAT_IDS

## Knowledge Gaps
- **258 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+253 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `loadDataset()` connect `load.ts` to `optimize.ts`, `roles.ts`, `swiss.ts`, `strings.ts`, `useEngine.ts`, `blend.ts`, `RoleSlot`, `answer.ts`, `stats.ts`, `quantile-sweep.ts`, `ROLE_LABEL_PT_BR`, `team-ranking.ts`, `schedule-bias.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `RoleSlot` connect `RoleSlot` to `optimize.ts`, `roles.ts`, `strings.ts`, `useEngine.ts`, `blend.ts`, `load.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `react` connect `strings.ts` to `plugins`, `useEngine.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _258 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `optimize.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07111501316944688 - nodes in this community are weakly interconnected._
- **Should `roles.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08145363408521303 - nodes in this community are weakly interconnected._
- **Should `swiss.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05925925925925926 - nodes in this community are weakly interconnected._