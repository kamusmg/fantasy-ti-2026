import { STAT_DEFINITIONS, ALL_STAT_IDS } from '../domain/stats';
import type { StatId } from '../domain/stats';
import { ALL_ROLE_SLOTS, playersInRole } from '../domain/roles';
import type { RoleSlot } from '../domain/roles';
import type { DataWarning, Estimate } from '../domain/estimate';
import type { ScoringRuleSet } from '../domain/rules';

/**
 * Mistura das duas fontes.
 *
 * A ideia central, e o motivo de nao ser uma media simples: o battlepass mediu
 * 2.888 replays TI-relevantes e e a melhor fonte pro NIVEL de cada stat. O unico
 * conteudo de informacao que o Reddit acrescenta e QUAIS TIMES estao acima ou
 * abaixo da media. Entao:
 *
 *   estimativa = nivelBattlepass + w x k x (deltaDoTimeNoReddit)
 *
 * Isso tem uma consequencia boa de graca: a prosa do Maroomm (que ranqueia Roshan
 * acima de Teamfight, contra as proprias tabelas dele) nunca consegue entrar em
 * numero nenhum. A discordancia some por construcao.
 */

export interface BlendInput {
  /** Cru do Reddit: slot -> teamId -> statId -> valor publicado (dupla = SOMA). */
  readonly reddit: Readonly<Record<RoleSlot, Readonly<Record<string, Readonly<Record<string, number>>>>>>;
  /** Media de liga do battlepass, ja na escala da funcao. */
  readonly battlepassLeague: Readonly<Record<RoleSlot, Readonly<Record<StatId, number>>>>;
  /** Mapas observados por (slot, teamId), quando o battlepass publica. */
  readonly sampleMaps: Readonly<Record<string, number>>;
  /** Razao top/average por (slot, teamId) — o estimador de amostra. */
  readonly topRatio: Readonly<Record<string, number>>;
  /** Quem entrou no top-8 TI-relevante do battlepass, por funcao. */
  readonly topEightByRole: Readonly<Record<RoleSlot, ReadonlySet<string>>>;
  readonly rules: ScoringRuleSet;
}

/**
 * Piso da transferibilidade. Nem a stat mais contaminada e zerada por completo —
 * a medida vem de n=16 com rotulo binario, entao nao merece confianca absoluta.
 */
const TRANSFERABILITY_FLOOR = 0.10;

/**
 * Quanto a vantagem de um time NAQUELA stat transfere pro TI.
 *
 * Medida: diferenca entre o z-score medio dos times que entraram no top-8
 * TI-relevante e o dos que ficaram de fora. Stat honesta separa positivo; stat
 * inflada por oposicao fraca separa negativo.
 *
 * ASSIMETRICA DE PROPOSITO. O top-8 do battlepass e ranqueado pelo estandarte de
 * referencia deles, entao as stats desse estandarte separam positivo por
 * construcao — a direcao positiva esta confundida e e ignorada. A negativa nao
 * esta: ficar de fora do estandarte explica separacao zero, nunca -0,98.
 */
export function transferability(
  roleScores: Readonly<Record<string, number>>,
  topEight: ReadonlySet<string>,
): number {
  const entries = Object.entries(roleScores);
  if (entries.length < 8) return 1;

  const values = entries.map(([, v]) => v);
  const mu = mean(values);
  const sd = Math.sqrt(populationVariance(values));
  if (sd === 0) return 1;

  const zIn = entries.filter(([t]) => topEight.has(t)).map(([, v]) => (v - mu) / sd);
  const zOut = entries.filter(([t]) => !topEight.has(t)).map(([, v]) => (v - mu) / sd);
  if (zIn.length === 0 || zOut.length === 0) return 1;

  const separation = mean(zIn) - mean(zOut);
  if (separation >= 0) return 1;
  return Math.max(TRANSFERABILITY_FLOOR, 1 + separation);
}

export interface BlendDiagnostics {
  /** Fator de escala por funcao. Longe de 1 = poolds de torneio diferentes. Perto de 2 ou 0,5 = unidade invertida. */
  readonly scaleFactor: Readonly<Record<RoleSlot, number>>;
  /** n0 = sigma2_dentro / sigma2_entre. Alto = a stat e grumosa e encolhe muito. */
  readonly priorStrength: Readonly<Record<RoleSlot, Readonly<Record<StatId, number>>>>;
  /** Quanto a vantagem de time naquela stat transfere pro TI. 1 = totalmente. */
  readonly transferability: Readonly<Record<RoleSlot, Readonly<Record<StatId, number>>>>;
  /** Amostra efetiva usada por (time, funcao) — publicada ou estimada. */
  readonly effectiveMaps: Readonly<Record<string, number>>;
  /** Ajuste que converte razao teto/media em mapas, por funcao. */
  readonly sampleCalibration: Readonly<Record<RoleSlot, SampleCalibration>>;
  readonly warnings: readonly DataWarning[];
}

export interface BlendResult {
  /** slot -> teamId -> statId -> Estimate, ja na escala da FUNCAO. */
  readonly perMapStat: Readonly<Record<RoleSlot, Readonly<Record<string, Readonly<Record<StatId, Estimate>>>>>>;
  readonly diagnostics: BlendDiagnostics;
}

/** Piso e teto do tamanho de amostra estimado. Extrapolacao selvagem nao ajuda ninguem. */
const MIN_ESTIMATED_MAPS = 8;
const MAX_ESTIMATED_MAPS = 200;
/** Usado so quando nem calibracao existe. */
const FALLBACK_SAMPLE_MAPS = 60;
const SMALL_SAMPLE_THRESHOLD = 40;

export interface SampleCalibration {
  readonly intercept: number;
  readonly slope: number;
  readonly correlation: number;
  readonly minObservedMaps: number;
  readonly minObservedRatio: number;
  readonly usable: boolean;
}

/**
 * Calibra tamanho de amostra a partir da razao top/average da tabela do Reddit.
 *
 * A ideia: `top` e a melhor partida unica da dupla e E[maximo de n] cresce com n.
 * Uma dupla com media alta mas teto baixo jogou poucos jogos, ou jogou sempre
 * contra o mesmo tipo de oposicao. Isso e informacao que estava indo pro lixo.
 *
 * A calibracao e feita contra os 8 times por funcao em que o battlepass publica
 * a contagem de mapas — dado independente. Medido: r = 0,69 / 0,68 / 0,52.
 * Ajuste em log(mapas) porque a relacao e de saturacao, nao linear.
 */
export function calibrateSampleSize(
  pairs: readonly { readonly ratio: number; readonly maps: number }[],
): SampleCalibration {
  const usablePairs = pairs.filter((p) => p.ratio > 0 && p.maps > 0);
  if (usablePairs.length < 4) {
    return { intercept: 0, slope: 0, correlation: 0, minObservedMaps: FALLBACK_SAMPLE_MAPS, minObservedRatio: 0, usable: false };
  }

  const xs = usablePairs.map((p) => p.ratio);
  const ys = usablePairs.map((p) => Math.log(p.maps));
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < xs.length; i += 1) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  const slope = sxx > 0 ? sxy / sxx : 0;
  const correlation = sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;

  return {
    intercept: my - slope * mx,
    slope,
    correlation,
    minObservedMaps: Math.min(...usablePairs.map((p) => p.maps)),
    minObservedRatio: Math.min(...xs),
    usable: slope > 0 && correlation > 0.3,
  };
}

export interface SampleEstimate {
  readonly maps: number;
  /** A razao caiu ABAIXO de toda a faixa calibrada — tratado como cota, nao extrapolacao. */
  readonly belowCalibrationRange: boolean;
}

export function estimateSampleMaps(ratio: number, cal: SampleCalibration): SampleEstimate {
  if (!cal.usable || ratio <= 0) {
    return { maps: FALLBACK_SAMPLE_MAPS, belowCalibrationRange: false };
  }
  const fitted = Math.exp(cal.intercept + cal.slope * ratio);
  const belowRange = ratio < cal.minObservedRatio;

  // Abaixo da faixa observada nao se extrapola: aplica-se a COTA. Se a razao e
  // menor que a do time com menos mapas que conhecemos, a amostra e no maximo
  // aquela. Mesma logica de censura usada no prefixo e no top-8.
  const bounded = belowRange ? Math.min(fitted, cal.minObservedMaps) : fitted;
  return {
    maps: Math.max(MIN_ESTIMATED_MAPS, Math.min(MAX_ESTIMATED_MAPS, bounded)),
    belowCalibrationRange: belowRange,
  };
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function populationVariance(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const mu = mean(values);
  return mean(values.map((v) => (v - mu) ** 2));
}

/**
 * Passo 0 — unidades. As linhas de Core e Suporte do Reddit sao SOMAS da dupla,
 * e a nota da funcao e a MEDIA. Meio ja e por jogador.
 *
 * Confirmado por fonte independente: Yuma&Wisper Teamfight 2728/2 = 1364 contra
 * o Teamfight de Core do battlepass, 1315.
 */
export function toRoleScale(rawValue: number, slot: RoleSlot): number {
  return rawValue / playersInRole(slot);
}

/**
 * Passo 1 — fator de escala por funcao, pela MEDIANA (nao pela media: uma celula
 * transcrita errada nao pode mover a escala inteira).
 */
function computeScaleFactor(
  redditLeagueMean: Readonly<Record<string, number>>,
  battlepassLeague: Readonly<Record<StatId, number>>,
): number {
  const ratios = ALL_STAT_IDS
    .filter((stat) => (redditLeagueMean[stat] ?? 0) > 0 && battlepassLeague[stat] > 0)
    .map((stat) => battlepassLeague[stat] / redditLeagueMean[stat]);
  return median(ratios);
}

/**
 * Desvio padrao por mapa da CONTRIBUICAO daquela stat pra nota da funcao.
 *
 * A dupla amortece variancia: Var(media de dois) = sigma2 (1+rho)/2. Por isso o
 * Meio, sozinho, guarda variancia cheia — e ganha mais com a regra dos 2 melhores
 * mapas, que transforma variancia em media.
 */
export function roleSd(statMean: number, statId: StatId, slot: RoleSlot, rules: ScoringRuleSet): number {
  const perPlayerSd = STAT_DEFINITIONS[statId].assumedCv * statMean;
  if (playersInRole(slot) === 1) return perPlayerSd;
  const dampening = Math.sqrt((1 + rules.intraDuoCorrelation) / 2);
  return perPlayerSd * dampening;
}

export function blend(input: BlendInput): BlendResult {
  const { reddit, battlepassLeague, sampleMaps, topRatio, topEightByRole, rules } = input;
  const warnings: DataWarning[] = [];
  const effectiveMaps: Record<string, number> = {};
  const calibrations: Record<string, SampleCalibration> = {};

  const perMapStat: Record<string, Record<string, Record<string, Estimate>>> = {};
  const scaleFactor: Record<string, number> = {};
  const priorStrength: Record<string, Record<string, number>> = {};
  const transferabilityByStat: Record<string, Record<string, number>> = {};

  for (const slot of ALL_ROLE_SLOTS) {
    const teamRows = reddit[slot];
    const teamIds = Object.keys(teamRows);
    const league = battlepassLeague[slot];

    /*
      Time com a linha VAZIA (troca de elenco invalidou o dado) continua em
      `teamIds` de proposito, pra nao sumir do ranking. Mas ele nao pode entrar
      em NENHUMA conta de dispersao: sem dado, a amostra efetiva dele e um chute
      no piso, e `meanSamplingVar` e uma media sobre todos os times — um piso ali
      dentro infla o ruido amostral estimado, derruba `varBetween`, sobe o n0 e
      encolhe TODO MUNDO na direcao da media da liga. Uma unidade cega mexeria
      na estimativa dos outros quinze times.
    */
    const teamsWithData = teamIds.filter((t) =>
      ALL_STAT_IDS.some((stat) => typeof teamRows[t][stat] === 'number'),
    );

    // Amostra efetiva: contagem publicada quando existe, estimativa calibrada pela
    // razao top/average quando nao. Substitui o chute fixo de 60 mapas.
    const calibration = calibrateSampleSize(
      teamsWithData
        .filter((t) => sampleMaps[unitKey(t, slot)] !== undefined && topRatio[unitKey(t, slot)] !== undefined)
        .map((t) => ({ ratio: topRatio[unitKey(t, slot)], maps: sampleMaps[unitKey(t, slot)] })),
    );
    calibrations[slot] = calibration;

    for (const t of teamsWithData) {
      const key = unitKey(t, slot);
      const published = sampleMaps[key];
      if (published !== undefined) {
        effectiveMaps[key] = published;
        continue;
      }
      const estimated = estimateSampleMaps(topRatio[key] ?? 0, calibration);
      effectiveMaps[key] = estimated.maps;
      if (estimated.belowCalibrationRange) {
        warnings.push({
          severity: 'warn',
          code: 'small-sample',
          messagePtBr:
            `${t} (${slot}) tem razao teto/media ${(topRatio[key] ?? 0).toFixed(2)}, ABAIXO de todos os times com contagem publicada. ` +
            `Amostra tratada como cota: no maximo ${Math.round(estimated.maps)} mapas. Estimativas fortemente puxadas pra media da liga.`,
        });
      }
    }

    // Media de liga do Reddit, ja na escala da funcao, por stat.
    const redditLeagueMean: Record<string, number> = {};
    const redditRoleScores: Record<string, Record<string, number>> = {};
    for (const stat of ALL_STAT_IDS) {
      const present = teamIds
        .filter((t) => typeof teamRows[t][stat] === 'number')
        .map((t) => toRoleScale(teamRows[t][stat], slot));
      if (present.length === 0) continue;
      redditLeagueMean[stat] = mean(present);
      redditRoleScores[stat] = {};
      for (const t of teamIds) {
        const raw = teamRows[t][stat];
        if (typeof raw === 'number') redditRoleScores[stat][t] = toRoleScale(raw, slot);
      }
    }

    const k = computeScaleFactor(redditLeagueMean, league);
    scaleFactor[slot] = k;

    if (k < 0.85 || k > 1.20) {
      const invertedUnits = k > 1.7 || k < 0.6;
      warnings.push({
        severity: invertedUnits ? 'critical' : 'warn',
        code: 'scale-mismatch',
        messagePtBr: invertedUnits
          ? `Escala da funcao ${slot} deu ${k.toFixed(2)} — perto de 2 ou 0,5 significa que a divisao por dupla foi feita no lado errado.`
          : `Escala da funcao ${slot} deu ${k.toFixed(2)}: os poolds de torneio das duas fontes diferem. Aplicado como escalar global.`,
      });
    }

    priorStrength[slot] = {};
    transferabilityByStat[slot] = {};
    perMapStat[slot] = {};
    for (const t of teamIds) perMapStat[slot][t] = {} as Record<string, Estimate>;

    for (const stat of ALL_STAT_IDS) {
      const leagueMean = league[stat];
      const hasReddit = redditLeagueMean[stat] !== undefined;

      // Passo 3 — forca do prior empirico-Bayes.
      const sdWithin = STAT_DEFINITIONS[stat].assumedCv * leagueMean;
      const varWithin = sdWithin ** 2;

      let n0 = Number.POSITIVE_INFINITY;
      if (hasReddit) {
        const scaled = teamIds
          .map((t) => redditRoleScores[stat][t])
          .filter((v): v is number => typeof v === 'number')
          .map((v) => leagueMean + k * (v - redditLeagueMean[stat]));
        const observedVar = populationVariance(scaled);
        const meanSamplingVar = mean(
          teamsWithData.map((t) => varWithin / effectiveMaps[unitKey(t, slot)]),
        );
        // Tira o ruido amostral da dispersao observada: sem isso, diferenca de time
        // que e puro ruido vira "sinal" e o encolhimento nunca acontece.
        const varBetween = Math.max(0, observedVar - meanSamplingVar);

        // Parte dessa dispersao entre times nao e habilidade que transfere pro TI,
        // e sim forca de tabela. Reduzir a variancia-entre TRANSFERIVEL e, dentro
        // do empirico-Bayes, exatamente encolher mais pra media da liga.
        const transfer = rules.applyTransferabilityShrinkage
          ? transferability(redditRoleScores[stat], topEightByRole[slot])
          : 1;
        transferabilityByStat[slot][stat] = transfer;
        const varBetweenTransferable = varBetween * transfer * transfer;

        n0 = varBetweenTransferable > 0 ? varWithin / varBetweenTransferable : Number.POSITIVE_INFINITY;
      }
      priorStrength[slot][stat] = n0;

      for (const t of teamIds) {
        const key = unitKey(t, slot);
        const nKnown = sampleMaps[key];
        const n = effectiveMaps[key];
        const teamValue = hasReddit ? redditRoleScores[stat][t] : undefined;

        if (teamValue === undefined) {
          // Sem dado de time: media de liga pura. E o caso do Meio/Azul.
          perMapStat[slot][t][stat] = {
            mean: leagueMean,
            sd: roleSd(leagueMean, stat, slot, rules),
            sampleMaps: null,
            provenance: 'league-mean-fallback',
            shrinkWeight: 0,
            notePtBr: 'Sem dado por time nesta cor. Media da liga do battlepass.',
          };
          continue;
        }

        const w = Number.isFinite(n0) ? n / (n + n0) : 0;
        const delta = k * (teamValue - redditLeagueMean[stat]);
        const blended = leagueMean + w * delta;

        perMapStat[slot][t][stat] = {
          mean: blended,
          sd: roleSd(blended, stat, slot, rules),
          sampleMaps: nKnown ?? null,
          provenance: 'blended',
          shrinkWeight: w,
          notePtBr: nKnown === undefined
            ? `Amostra estimada pela razao teto/media: ~${Math.round(n)} mapas.`
            : undefined,
        };
      }
    }
  }

  // Aviso de amostra pequena, ja com o peso medido junto — assim o "OG so tem
  // 21 mapas" vira numero, nao emblema decorativo.
  for (const [key, n] of Object.entries(sampleMaps)) {
    if (n >= SMALL_SAMPLE_THRESHOLD) continue;
    warnings.push({
      severity: 'warn',
      code: 'small-sample',
      messagePtBr: `${key} tem so ${n} mapas observados — as estimativas dele sao puxadas pra media da liga.`,
    });
  }

  return {
    perMapStat: perMapStat as BlendResult['perMapStat'],
    diagnostics: {
      scaleFactor: scaleFactor as BlendDiagnostics['scaleFactor'],
      priorStrength: priorStrength as BlendDiagnostics['priorStrength'],
      transferability: transferabilityByStat as BlendDiagnostics['transferability'],
      effectiveMaps,
      sampleCalibration: calibrations as BlendDiagnostics['sampleCalibration'],
      warnings,
    },
  };
}

function unitKey(t: string, slot: RoleSlot): string {
  return `${t}:${slot}`;
}
