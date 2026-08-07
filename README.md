# Fantasy TI 2026 — calculadora de escalação

Programa de tela cheia (1920×1080) para a live do KamusMG que calcula a escalação
ótima do Dota dos Sonhos do The International 2026.

```bash
npm run dev          # tela em http://localhost:5173
npm test             # 28 testes do motor
npx vite-node scripts/answer.ts   # a resposta no terminal
```

## O que o programa faz

Enumera **9.216 escalações** (16 times × todas as atribuições de stat válidas por
estandarte) × **64 títulos de treinador**, e devolve a melhor. Roda em ~200 ms.

## Como o TI 2026 funciona de verdade

Você faz **3 escolhas de time**, não 9 escolhas de stat:

| Fatia | O que você leva |
|---|---|
| Principal | posições 1 **e** 3 daquele time |
| Meio | posição 2 |
| Suporte | posições 4 **e** 5 |

Depois monta os **Estandartes de Guerra**, com cor fixa por função (Fase de Grupos:
Principal V‑Vd‑V, Meio V‑A‑Vd, Suporte A‑Vd‑A). Cada emblema leva uma stat daquela
cor, uma qualidade (I..V = +10/30/60/100/150%) e um traço. Mais um **Título de
Treinador** (prefixo + sufixo) valendo para os 5 jogadores.

**A nota de uma função é a MÉDIA dos jogadores nela**, nunca a soma. Contam as
**2 melhores partidas** de cada série e a **melhor série** do período.

## As decisões que definem o resultado

**Estatística de ordem.** As regras têm dois operadores de seleção, e `E[max] ≠ max[E]`.
Somar médias subestima o período em ~30% e — pior — inverte o ranking entre stats de
alta e baixa variância. O motor propaga `(média, desvio)` por `2‑melhores‑de‑N` e
`melhor‑de‑K`. O battlepass.ru não faz isso.

**A curva de prêmio é côncava em pontos.** Ela é convexa em *percentil*, mas percentil
é eixo comprimido: subir do percentil 80 ao 90 rende ~5.900 pts por unidade de z; do 95
ao 100, ~1.500. Logo o objetivo padrão é a média, com p10/p90 sempre na tela.

**Nível do battlepass, delta de time do Reddit.** `estimativa = médiaDaLiga + w · k · deltaDoTime`,
com `w = n/(n+n₀)` empírico‑Bayes. Efeito colateral bom: a prosa do Maroomm (que ranqueia
Roshan acima de Teamfight, contra as próprias tabelas dele) nunca entra em número nenhum.

**Amostra estimada, não chutada.** Para os times sem contagem publicada, o tamanho de
amostra vem da razão `topo/média` da tabela do Reddit — `E[máximo de n]` cresce com `n`.
Calibrado contra os times com contagem conhecida: r = 0,69 / 0,68 / 0,52.

**Correção de força de tabela.** Mediu-se, por stat, o z médio dos times que entraram no
top‑8 TI‑relevante menos o dos que ficaram de fora. Poucas Mortes no Meio dá **−0,60**;
Tormentor no Principal, **−0,98**. Ou seja: morrer pouco e pegar objetivo de graça são
marcas de oposição fraca. A correção é **assimétrica** — só penaliza, nunca premia —
porque a direção positiva está confundida com o estandarte de referência do battlepass.

## Verificação

O teste-oráculo reproduz os **4 ganhos de título publicados pelo battlepass.ru** dentro
de 2% com uma única constante, validando de uma vez unidades, mistura de fontes, modelo
de treinador e a regra da média. A validação cruzada mais forte: a taxa de herói azul
implicada pelo ganho do Cerúleo (battlepass, 0,3234) bate com a média da nossa tabela de
frequência (Reddit, 0,3153) — **2,5% de diferença entre fontes que não se falam**.

Outros travamentos: fator de escala por função em [0,80; 1,30] (mede 1,02, confirmando a
divisão por dupla); exatidão do otimizador contra força bruta do produto completo; guarda
de NaN na enumeração inteira; saída determinística bit a bit; `Math.random` e `Date.now`
proibidos em `engine/`.

Duas armadilhas do jogo foram descobertas por teste de propriedade e estão fixadas:
**subir uma qualidade pode PIORAR** o estandarte (quebra a condição do Fractal), e
**trocar um traço por Benevolente pode piorar os vizinhos** (quebra o degrau do Amigável).

## As 4 perguntas em aberto

Só o cliente do Dota responde. Estão como flag em `src/domain/rules.ts`.

| # | Pergunta | Impacto |
|---|---|---|
| 1 | O período soma as séries ou pega a melhor? | ±30% em todo total |
| 2 | Um emblema aceita qualquer stat da sua cor? | muda o espaço de busca |
| 3 | Dois emblemas podem levar a mesma stat? | "GPM dobrado" pode ser ótimo |
| 4 | Clutch é sempre o jogo 3 ou o decisivo? | ~±300 pts |

## Estrutura

```
src/domain/    tipos e constantes; toda suposição não verificada em rules.ts
src/engine/    puro, total, determinístico — nenhuma aleatoriedade sem semente
src/data/      JSON cru intocado + Zod na fronteira + mistura + auditoria
src/features/  telas
src/ui/        tema TI e moldura de transmissão 1920×1080
scripts/       relatórios de terminal (answer, report, censor-check, schedule-bias)
```

Fontes: [guia do u/Maroomm](https://www.reddit.com/r/DotA2/comments/1vble84/fantasy_league_2026_guide/)
(13 torneios, 1.601 partidas) · [battlepass.ru](https://battlepass.ru/en/ti2026/fantasy-calc)
(2.888 replays, 03/08/2026) · Liquipedia · transcrição do painel "Como Jogar" do cliente.
