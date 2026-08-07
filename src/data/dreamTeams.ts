import raw from './raw/dreamTeams.json';
import type { RoleSlot } from '../domain/roles';
import type { CoachTitle } from '../domain/titles';

/**
 * Escalacoes de Dota dos Sonhos de outras pessoas.
 *
 * Pontuadas pelo NOSSO motor, com a mesma regua — e essa e a graca: a comparacao
 * so vale se todo mundo for medido igual. Se alguem ganhar de nos, aparece.
 *
 * REGRA: so entra escalacao realmente vista, com a fonte na tela junto. `title`
 * fica `null` quando a pessoa nao escolheu titulo — nao se preenche com o que
 * ela "provavelmente escolheria".
 */
export interface DreamTeamAuthor {
  readonly id: string;
  readonly name: string;
  readonly source: string;
  readonly url?: string;
  readonly teams: Readonly<Record<RoleSlot, string>>;
  readonly title: CoachTitle | null;
  readonly titleNote?: string;
  readonly notes: readonly string[];
}

interface RawAuthor {
  readonly id?: string;
  readonly name?: string;
  readonly source?: string;
  readonly url?: string;
  readonly core?: string;
  readonly mid?: string;
  readonly support?: string;
  readonly title?: CoachTitle | null;
  readonly titleNote?: string;
  readonly notes?: readonly string[];
}

/** Escalacao incompleta e descartada: meia escalacao na tela pareceria escolha que nao houve. */
export function loadDreamTeamAuthors(validTeamIds: ReadonlySet<string>): readonly DreamTeamAuthor[] {
  const entries = (raw.authors ?? []) as RawAuthor[];

  return entries.flatMap((entry) => {
    const { id, name, source, core, mid, support } = entry;
    if (!id || !name || !source || !core || !mid || !support) return [];
    if (![core, mid, support].every((teamId) => validTeamIds.has(teamId))) return [];

    return [{
      id,
      name,
      source,
      url: entry.url,
      teams: { core, mid, support },
      title: entry.title ?? null,
      titleNote: entry.titleNote,
      notes: entry.notes ?? [],
    }];
  });
}
