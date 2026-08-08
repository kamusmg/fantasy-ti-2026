import { describe, expect, it } from 'vitest';
import { leagueTargets, tieCount } from './rerollTargets';
import { loadDataset } from '../data/load';
import type { StatId } from '../domain/stats';

/**
 * A REGRA GERAL, travada.
 *
 * Este teste existe por causa de um erro real: a tela do Guia abria travada na
 * equipe RECOMENDADA, e no azul do Suporte a recomendada (LGD) e uma das duas
 * equipes, de 16, em que Vigias Ativados passa Sentinelas Posicionadas. Quem
 * batia o olho — inclusive eu, por escrito, duas vezes — lia "Vigias e o melhor
 * azul do Suporte", que e falso na liga.
 *
 * O conserto foi fazer a media da liga ser o PADRAO. O que trava o conserto e
 * isto aqui: se a ordem geral mudar sem que os dados mudem, o teste cai.
 *
 * Os numeros sao os do battlepass.ru (2.888 replays, 14 ligas) — fonte
 * independente da tabela do Reddit, e as duas concordam na ordem a menos de 4%.
 */
const data = loadDataset();

const orderOf = (slot: 'core' | 'mid' | 'support', color: 'red' | 'blue' | 'green'): StatId[] => {
  const targets = leagueTargets(slot, 'groupStage', data.leagueMean)
    .find((c) => c.color === color);
  if (!targets) throw new Error(`${slot} nao tem emblema ${color}`);
  return targets.targets.map((t) => t.statId);
};

describe('ranking na media da liga', () => {
  it('o melhor azul do SUPORTE e Sentinelas Posicionadas, nao Vigias', () => {
    const blue = orderOf('support', 'blue');
    expect(blue[0]).toBe('wardsPlaced');
    // A ordem inteira, que e a que o guia publica como regra geral.
    expect(blue).toEqual(['wardsPlaced', 'smokes', 'campsStacked', 'watchers', 'lotuses', 'runes']);
  });

  it('o melhor azul do MEIO e Runas, com folga', () => {
    const blue = leagueTargets('mid', 'groupStage', data.leagueMean).find((c) => c.color === 'blue');
    expect(blue?.targets[0].statId).toBe('runes');
    // Nao ha empate no azul do Meio: o segundo nao chega a um terco do primeiro.
    expect(blue?.targets[1].shareOfBest).toBeLessThan(0.4);
    expect(tieCount(blue!)).toBe(0);
  });

  it('o verde de toda funcao e dominado por Participacao em Batalhas', () => {
    for (const slot of ['core', 'mid', 'support'] as const) {
      expect(orderOf(slot, 'green')[0]).toBe('teamfight');
    }
  });

  it('o vermelho de Principal e Meio empata em TRES', () => {
    for (const slot of ['core', 'mid'] as const) {
      const red = leagueTargets(slot, 'groupStage', data.leagueMean).find((c) => c.color === 'red');
      expect(tieCount(red!)).toBe(3);
    }
  });

  /**
   * O empate e o prefixo da lista, sempre. Se algum dia um 'guardar' aparecer
   * depois de um 'rerolar', a faixa verde da tela marcaria as linhas erradas.
   */
  it('os empatados sao sempre os primeiros da lista', () => {
    for (const slot of ['core', 'mid', 'support'] as const) {
      for (const color of leagueTargets(slot, 'groupStage', data.leagueMean)) {
        const verdicts = color.targets.map((t) => t.verdict);
        const lastKeep = verdicts.lastIndexOf('guardar');
        const firstOther = verdicts.findIndex((v) => v !== 'guardar');
        if (lastKeep >= 0 && firstOther >= 0) expect(lastKeep).toBeLessThan(firstOther);
      }
    }
  });

  /** O Principal nao tem azul e o Suporte nao tem vermelho — nem na media da liga. */
  it('a cor ausente continua ausente', () => {
    expect(leagueTargets('core', 'groupStage', data.leagueMean).some((c) => c.color === 'blue')).toBe(false);
    expect(leagueTargets('support', 'groupStage', data.leagueMean).some((c) => c.color === 'red')).toBe(false);
  });
});
