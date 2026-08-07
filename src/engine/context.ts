import type { LoadedData } from '../data/load';
import { ALL_ROLE_SLOTS } from '../domain/roles';
import type { Period, RoleSlot } from '../domain/roles';
import { DEFAULT_RULES } from '../domain/rules';
import type { ScoringRuleSet } from '../domain/rules';
import swiss from '../data/generated/swiss.json';
import { DEFAULT_SERIES_SHAPE, GROUP_STAGE_SCHEDULE, groupStageSchedule } from './aggregate';
import type { PeriodSchedule, SeriesShape } from './aggregate';
import { prefixLeagueMeans } from './coach';
import type { TitleContext } from './coach';
import { planningRolls } from './enumerate';
import type { EmblemRoll } from './enumerate';
import type { EngineContext } from './optimize';

/**
 * Probabilidade de derrota por funcao, enquanto o modelo do Suico nao entra.
 *
 * 0,5 e o neutro. A media da liga implicada pelo battlepass e 0,524. Com todo
 * time no mesmo valor, o sufixo Azarao vira independente de time — ou seja,
 * AINDA NAO estamos capturando a vantagem real dele (elenco mais fraco perde
 * mais e dispara mais o bonus). Isso entra com o Suico.
 */
export const NEUTRAL_LOSS_PROBABILITY = 0.5;

export interface ContextOptions {
  readonly period?: Period;
  readonly rules?: ScoringRuleSet;
  readonly seriesShape?: SeriesShape;
  /** Cronograma por time. Ausente = usa o Suico pre-computado. */
  readonly scheduleByTeam?: ReadonlyMap<string, PeriodSchedule>;
  readonly defaultSchedule?: PeriodSchedule;
  readonly lossProbabilityByRole?: Readonly<Record<RoleSlot, number>>;
  /** Estandarte ja rolado. Ausente = modo Planejamento (tudo Tier III, sem traco). */
  readonly rolls?: Readonly<Record<RoleSlot, readonly EmblemRoll[]>>;
}

/**
 * Cronograma de cada time a partir do Suico pre-computado.
 *
 * Substitui o "todo mundo joga 5,5 series", que era a suposicao que o proprio
 * codigo marcava como errada pra time forte: quem atropela o grupo joga MENOS.
 */
function scheduleFromSwiss(): ReadonlyMap<string, PeriodSchedule> {
  const out = new Map<string, PeriodSchedule>();
  for (const [teamId, probs] of Object.entries(swiss.bucketProbability)) {
    out.set(teamId, groupStageSchedule(probs as Record<string, number>));
  }
  return out;
}

export function buildContext(data: LoadedData, options: ContextOptions = {}): EngineContext {
  const period = options.period ?? 'groupStage';
  const rules = options.rules ?? DEFAULT_RULES;

  const titleContext: TitleContext = {
    prefixLeagueMean: prefixLeagueMeans(data.players.values()),
    lossProbabilityByRole: options.lossProbabilityByRole ?? {
      core: NEUTRAL_LOSS_PROBABILITY,
      mid: NEUTRAL_LOSS_PROBABILITY,
      support: NEUTRAL_LOSS_PROBABILITY,
    },
  };

  const rolls = options.rolls ?? (Object.fromEntries(
    ALL_ROLE_SLOTS.map((slot) => [slot, planningRolls(slot, period)]),
  ) as Record<RoleSlot, readonly EmblemRoll[]>);

  return {
    roleUnits: data.roleUnits,
    players: data.players,
    teamIds: [...data.teams.keys()],
    rules,
    period,
    seriesShape: options.seriesShape ?? DEFAULT_SERIES_SHAPE,
    scheduleByTeam: options.scheduleByTeam ?? scheduleFromSwiss(),
    defaultSchedule: options.defaultSchedule ?? GROUP_STAGE_SCHEDULE,
    titleContext,
    rolls,
  };
}
