import { describe, expect, it } from 'vitest';
import { loadDataset } from './load';
import { blend } from './blend';
import { parseOrThrow, rosterChangesSchema } from './schema';
import rosterChangesRaw from './raw/rosterChanges.json';
import teamsRaw from './raw/teams.json';
import prefixFrequencyRaw from './raw/prefixFrequency.json';
import { roleUnitKey } from '../domain/roster';
import { ALL_STAT_IDS } from '../domain/stats';
import { ALL_ROLE_SLOTS } from '../domain/roles';
import { DEFAULT_RULES } from '../domain/rules';

/**
 * TROCA DE ELENCO — o caso do TaiLung.
 *
 * Ele foi banido do TI 2026 por 322 e o Topson entrou no lugar. A tentacao era
 * so trocar o nome em teams.json. Isso teria tirado o nome da tela e deixado a
 * ESTATISTICA dele recomendando time por baixo, calada: as duas fontes mediram
 * o TaiLung, e o motor continuaria usando a medida como se fosse do Topson.
 *
 * Os testes daqui travam as tres partes da correcao:
 *   1. o dado de time morre junto com o jogador;
 *   2. a unidade cega NAO some do ranking (sumir e mentir por omissao);
 *   3. a unidade cega nao contamina a estimativa dos outros quinze times.
 */

const data = loadDataset();

/*
  Passa pela MESMA fronteira Zod que o motor usa, em vez de ler o JSON cru. Alem
  de tipar `slot` de verdade, isso faz o teste falhar se alguem escrever a funcao
  errada no arquivo — que seria uma invalidacao silenciosa de coisa nenhuma.
*/
const changes = parseOrThrow(rosterChangesSchema, rosterChangesRaw, 'rosterChanges.json').changes;

describe('rosterChanges.json descreve o mundo de verdade', () => {
  it('tem a troca do TaiLung pelo Topson', () => {
    const c = changes.find((x) => x.out.id === 'tailung');
    expect(c).toBeDefined();
    expect(c?.teamId).toBe('lgd');
    expect(c?.slot).toBe('mid');
    expect(c?.in.id).toBe('topson');
  });

  /*
    O guarda que impede a troca pela metade. Sem ele, alguem declara a troca aqui
    e esquece de mexer em teams.json — o motor invalida o dado certo e a tela
    segue mostrando o jogador que saiu.
  */
  it.each(changes.map((c) => [c.out.nick, c] as const))(
    'quem saiu (%s) nao esta mais em teams.json, e quem entrou esta na posicao declarada',
    (_nick, change) => {
      const team = teamsRaw.teams.find((t) => t.id === change.teamId);
      expect(team).toBeDefined();

      expect(team?.players.some((p) => p.id === change.out.id)).toBe(false);

      const entrou = team?.players.find((p) => p.id === change.in.id);
      expect(entrou).toBeDefined();
      expect(entrou?.position).toBe(change.in.position);
      expect(entrou?.nick).toBe(change.in.nick);
    },
  );

  it('quem saiu nao sobrou na tabela de cor de heroi', () => {
    const byPlayer = prefixFrequencyRaw.byPlayer as Record<string, unknown>;
    for (const c of changes) expect(byPlayer[c.out.id]).toBeUndefined();
  });

  it('o nome de quem saiu nao chega em jogador nenhum do dataset', () => {
    const nicks = [...data.players.values()].map((p) => `${p.id} ${p.nick}`.toLowerCase());
    for (const c of changes) {
      expect(nicks.some((n) => n.includes(c.out.id.toLowerCase()))).toBe(false);
      expect(nicks.some((n) => n.includes(c.out.nick.toLowerCase()))).toBe(false);
    }
  });
});

describe('a unidade trocada perde o dado de time', () => {
  it.each(changes.filter((c) => c.invalidatesTeamData).map((c) => [`${c.teamId}/${c.slot}`, c] as const))(
    '%s cai na media da liga em TODAS as stats, com peso de encolhimento zero',
    (_label, change) => {
      const unit = data.roleUnits.get(roleUnitKey(change.teamId, change.slot));
      expect(unit).toBeDefined();

      for (const stat of ALL_STAT_IDS) {
        const e = unit!.perMapStat[stat];
        expect(e.provenance).toBe('league-mean-fallback');
        expect(e.shrinkWeight).toBe(0);
        // A media da liga daquela funcao, exatamente — nada de delta de time sobrando.
        expect(e.mean).toBeCloseTo(data.leagueMean[change.slot][stat], 6);
      }
    },
  );

  /*
    Continuar escolhivel importa: quem esta montando o fantasy precisa poder pegar
    o LGD no Meio e VER que aquele slot ficou cego. Sumir do ranking esconderia a
    opcao em vez de informar sobre ela.
  */
  it('mas continua no ranking, com aviso de troca de elenco', () => {
    for (const change of changes.filter((c) => c.invalidatesTeamData)) {
      const unit = data.roleUnits.get(roleUnitKey(change.teamId, change.slot))!;
      expect(unit.warnings.map((w) => w.code)).toContain('roster-change');
    }
  });

  it('o dataset avisa alto sobre a troca', () => {
    const avisos = data.warnings.filter((w) => w.code === 'roster-change');
    expect(avisos.length).toBeGreaterThan(0);
    expect(avisos[0].messagePtBr).toContain('TaiLung');
    expect(avisos[0].messagePtBr).toContain('Topson');
  });
});

/**
 * O BUG QUE A TROCA REVELOU.
 *
 * `meanSamplingVar` era uma media sobre TODOS os times da funcao, mas
 * `observedVar` so sobre os que tinham numero. Enquanto os 16 tinham dado, os
 * dois conjuntos eram iguais e ninguem percebia. Com uma linha vazia, o time sem
 * dado entrava com amostra chutada no piso, inflava o ruido amostral estimado,
 * derrubava a variancia-entre, subia o n0 e encolhia TODO MUNDO pra media da
 * liga — uma unidade cega mexendo na estimativa dos outros quinze.
 */
describe('unidade cega nao contamina os outros times', () => {
  const league = data.leagueMean;

  const ALVO = 'vici';

  /*
    A primeira versao deste teste PASSAVA com o bug ainda no lugar, e so descobri
    porque reverti o conserto de proposito pra ver o teste falhar. O motivo: eu
    passava `sampleMaps` e `topRatio` vazios, entao a calibracao ficava inutil e
    TODO time caia no mesmo fallback de 60 mapas — media sobre 16 iguais e igual a
    media sobre 15 iguais, e a contaminacao nao tinha como aparecer.

    Aqui os quinze times tem amostra publicada bem acima do fallback. Assim a
    unidade cega entra na conta com 60 mapas contra ~120 dos outros, infla o ruido
    amostral medio e vaza pra estimativa de todo mundo. Teste que nao falha sem o
    conserto nao esta testando o conserto.
  */
  const midTeams = [...data.roleUnits.values()].filter((u) => u.slot === 'mid').map((u) => u.teamId);
  const sampleMaps: Record<string, number> = {};
  const topRatio: Record<string, number> = {};
  midTeams.filter((t) => t !== ALVO).forEach((t, i) => {
    sampleMaps[`${t}:mid`] = 100 + i * 6;
    topRatio[`${t}:mid`] = 2.4 + i * 0.05;
  });

  /** `modo` decide o que acontece com ALVO no Meio: fica inteiro, vazio, ou fora. */
  const blendWith = (modo: 'inteiro' | 'vazio' | 'ausente') => {
    const reddit = Object.fromEntries(
      ALL_ROLE_SLOTS.map((slot) => [
        slot,
        Object.fromEntries(
          [...data.roleUnits.values()]
            .filter((u) => u.slot === slot)
            .filter((u) => !(modo === 'ausente' && slot === 'mid' && u.teamId === ALVO))
            .map((u) => [
              u.teamId,
              modo === 'vazio' && slot === 'mid' && u.teamId === ALVO
                ? {}
                : Object.fromEntries(ALL_STAT_IDS.map((s) => [s, u.perMapStat[s].mean])),
            ]),
        ),
      ]),
    ) as Parameters<typeof blend>[0]['reddit'];

    return blend({
      reddit,
      battlepassLeague: league,
      sampleMaps,
      topRatio,
      topEightByRole: { core: new Set(), mid: new Set(), support: new Set() },
      rules: DEFAULT_RULES,
    });
  };

  /*
    A propriedade exata. Tirar um time MUDA a media de liga do Reddit e a
    dispersao entre times, e essa parte e legitima — com 15 times o mundo e outro.
    O que nao pode e a linha VAZIA valer diferente da linha AUSENTE: nos dois
    casos aquele time nao tem nada a dizer, entao os outros quinze tem que
    receber exatamente a mesma estimativa. Era aqui que o piso de amostra chutado
    vazava pra todo mundo.
  */
  it('linha vazia vale exatamente o mesmo que linha ausente, pros outros times', () => {
    const vazio = blendWith('vazio');
    const ausente = blendWith('ausente');

    for (const teamId of Object.keys(ausente.perMapStat.mid)) {
      for (const stat of ALL_STAT_IDS) {
        expect(vazio.perMapStat.mid[teamId][stat].mean).toBeCloseTo(
          ausente.perMapStat.mid[teamId][stat].mean,
          9,
        );
      }
    }
  });

  it('e a diferenca entre os dois e so o time cego continuar existindo', () => {
    const vazio = blendWith('vazio');
    const ausente = blendWith('ausente');

    expect(ausente.perMapStat.mid[ALVO]).toBeUndefined();

    const cego = vazio.perMapStat.mid[ALVO];
    expect(cego).toBeDefined();
    for (const stat of ALL_STAT_IDS) {
      expect(cego[stat].provenance).toBe('league-mean-fallback');
      expect(cego[stat].mean).toBeCloseTo(league.mid[stat], 9);
    }
  });
});
