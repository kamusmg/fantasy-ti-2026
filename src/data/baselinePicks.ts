import { BUCKET_ORDER, BUCKET_SLOTS } from '../engine/swiss';
import type { Bucket } from '../engine/swiss';

/**
 * O PALPITE DE QUEM NAO MEXEU.
 *
 * A tela de Palpites do cliente ja vem PREENCHIDA nesta ordem — a semeadura da
 * Valve. Verificado em dois prints independentes, o do Kamus e o do Topson, com
 * a ordem byte a byte identica; isso so acontece se nenhum dos dois tiver
 * tocado na tela.
 *
 * Logo, este arranjo e o palpite efetivo de todo mundo que abriu e nao mexeu —
 * e a regua mais justa que existe pra medir se a conta serve pra alguma coisa.
 * Melhor que o sorteio, porque a semeadura da Valve ja carrega informacao.
 *
 * Medido: sorteio 3,75 · nao mexer 4,60 · nosso modelo 5,10.
 */
const DEFAULT_ORDER: readonly string[] = [
  // linha 1: 4-0 | 4-1 (x2) | vencedora da eliminatoria (x5)
  'yandex', 'vision', 'falcons', 'spirit', 'liquid', 'boomboys', 'xtreme', 'og',
  // linha 2: perdedora da eliminatoria (x5) | 1-4 (x2) | 0-4
  'nigma', 'lgd', 'aurora', 'ironwing', 'vici', 'gamerlegion', 'resilience', 'huligani',
];

function buildSlots(): readonly Bucket[] {
  const slots: Bucket[] = [];
  for (const bucket of BUCKET_ORDER) {
    for (let i = 0; i < BUCKET_SLOTS[bucket]; i += 1) slots.push(bucket);
  }
  return slots;
}

export const UNTOUCHED_PICKS: Readonly<Record<string, Bucket>> = Object.fromEntries(
  DEFAULT_ORDER.map((teamId, i) => [teamId, buildSlots()[i]]),
);
