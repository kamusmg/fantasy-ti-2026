import raw from './raw/proPicks.json';
import { BUCKET_ORDER, BUCKET_SLOTS } from '../engine/swiss';
import type { Bucket } from '../engine/swiss';

/**
 * Palpites de profissionais, pra comparar com os nossos.
 *
 * REGRA INVIOLAVEL, e ela vale mais que a funcionalidade: so entra palpite que
 * foi REALMENTE VISTO — print, post ou clipe. Nunca extrapolado. Atribuir
 * palpite inventado a uma pessoa real, em portugues e em tela cheia, e mentira
 * sobre alguem que existe, e nenhum momento de live paga por isso.
 */
export interface ProPicks {
  readonly id: string;
  readonly name: string;
  /** De onde saiu. Vai pra tela junto com os palpites — sem fonte, nao entra. */
  readonly source: string;
  readonly capturedAt: string;
  readonly picks: Readonly<Record<string, Bucket>>;
}

export interface Disagreement {
  readonly teamId: string;
  readonly ours: Bucket;
  readonly theirs: Bucket;
}

export interface ProComparison {
  readonly pro: ProPicks;
  readonly agreements: number;
  readonly disagreements: readonly Disagreement[];
}

function isValid(entry: Record<string, unknown>): boolean {
  if (typeof entry.id !== 'string' || entry.id === 'exemplo') return false;
  const picks = entry.picks;
  if (typeof picks !== 'object' || picks === null) return false;

  // As contagens tem que bater com as vagas. Palpite pela metade na tela seria
  // pior que palpite nenhum: pareceria que a pessoa escolheu o que nao escolheu.
  const counts = new Map<string, number>();
  for (const bucket of Object.values(picks as Record<string, string>)) {
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return BUCKET_ORDER.every((b) => (counts.get(b) ?? 0) === BUCKET_SLOTS[b]);
}

/** Só devolve entradas completas e válidas. Incompleto é descartado em silêncio proposital. */
export function loadProPicks(): readonly ProPicks[] {
  const entries = (raw.pros ?? []) as unknown as Record<string, unknown>[];
  return entries.filter(isValid) as unknown as ProPicks[];
}

export function compareWithPro(
  ours: Readonly<Record<string, Bucket>>,
  pro: ProPicks,
): ProComparison {
  const disagreements: Disagreement[] = [];
  let agreements = 0;

  for (const [teamId, theirs] of Object.entries(pro.picks)) {
    const our = ours[teamId];
    if (our === undefined) continue;
    if (our === theirs) agreements += 1;
    else disagreements.push({ teamId, ours: our, theirs });
  }

  return { pro, agreements, disagreements };
}
