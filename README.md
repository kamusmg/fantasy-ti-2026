# Cola do Fantasy — The International 2026

**[dota2fantasy.pages.dev](https://dota2fantasy.pages.dev)** · calculadora aberta do Dota dos Sonhos, dos Palpites e do estandarte do TI 2026.

*[Read in English](README.en.md)*

Feita para a live do [KamusMG](https://twitch.tv/kamusmg). Os dados e o motor estão
todos aqui — use, copie, discorde, abra issue.

---

## A resposta curta

| | Time | |
|---|---|---|
| **SUPORTE** (pos 4+5) | **LGD Gaming** — Thiolicor + KJ | 13% à frente do 2º |
| **MEIO** (pos 2) | **Team Falcons** — Malr1ne | empate técnico com BoomBoys |
| **PRINCIPAL** (pos 1+3) | **TEAM VISION** — Satanic + Noticed | empate com LGD, desempatado pelas odds |
| **TREINADOR** | **o Decisivo Cerúleo** | +11% herói azul, +16% última partida |

**Gaste as 40 fichas no MEIO.** Rende +47%, o dobro das outras duas funções — porque
Runas vale 3× a segunda melhor stat azul, enquanto o azul do Suporte é achatado.

**Só existe conserto direto de *stat* em emblema VERDE.** No vermelho você só mira
qualidade, no azul só traço. Subir qualidade de uma stat ruim é polir lixo.

⚠️ **Com Fractal no estandarte, SUBIR uma qualidade pode BAIXAR sua nota.** Ele só
paga se as três qualidades forem diferentes. Nenhuma calculadora pública avisa disso.

---

## O que quase todo mundo modela errado

**Você não escolhe as stats.** Glossário do jogo: *"Rerolling the stat of an emblem will
guarantee a new stat."* Stat, qualidade e traço vêm **sorteados**. As únicas decisões
livres são o **time por função** e o **título** — e as duas são de graça e ilimitadas até
o fechamento. Por isso a cola são três nomes de time, não um "build de 9 stats".

**A nota de uma função é a MÉDIA dos jogadores**, não a soma. Core e Suporte são duplas.

**Conta a MELHOR série do período**, e dentro dela as **2 melhores partidas**. Isso tem
duas consequências que ninguém precifica:

1. Somar médias subestima o período em **~30%**, e — pior — inverte o ranking entre
   stats de alta e baixa variância. `E[max] ≠ max[E]`.
2. Jogar **mais séries é opção grátis**. Um time que faz 4-0 joga 4 séries; quem cai na
   eliminatória joga 6. Time mediano pode valer mais que favorito.

---

## As quatro telas

| tecla | URL | o que faz |
|---|---|---|
| **1** | `#sonhos` | **Dota dos Sonhos** — a cola: três equipes e o título, com seletor de autor (Claude / Desleal Dota / Gemini 3.1 Pro) |
| **2** | `#palpites` | **Palpites** — as 16 equipes encaixadas nas vagas do Suíço, com seletor de autor e sobreposição de comparação |
| **G** | `#guia` | **Guia de Atributos** — os 18 atributos em ordem de valor por função e por cor, com seletor de equipe |
| **T** | `#tracos` | **Meu Estandarte** — simulador: escolha o nível e o traço que caíram e veja a porcentagem, pela conta do cliente |

`L` troca o idioma. Os endereços com `#` abrem direto na tela, o que serve pra
uma fonte de navegador por cena no OBS.

**Todo nome de jogo vem da localização oficial da Valve** — `dota_brazilian.txt`
e `dota_english.txt` para traços e títulos, e o glossário do cliente
(`GLOSSARIO_PONTUACAO_2026.md`) para os 18 atributos. Não há tradução nossa em
nenhum termo do jogo.

## Os dados

Tudo em [`src/data/raw/`](src/data/raw), cru e com procedência.

| Arquivo | O que tem | Fonte |
|---|---|---|
| `reddit.roleStats.json` | valor de cada stat para as 16 duplas Core, 16 mids, 16 duplas Sup | [guia do u/Maroomm](https://www.reddit.com/r/DotA2/comments/1vble84/fantasy_league_2026_guide/) — 13 torneios, 1.601 partidas |
| `battlepass.leagueStats.json` | valor por stat por função, nível de liga | [battlepass.ru](https://battlepass.ru/en/ti2026/fantasy-calc) — 2.888 replays |
| `battlepass.topRoles.json` | notas do top-8 por função + mapas observados | idem |
| `prefixFrequency.json` | frequência de cor de herói dos 80 jogadores | Reddit, mesma base |
| `teamStrength.json` | força de time para simular o Suíço | odds do Polymarket + Elo da OpenDota |
| `teams.json` | os 16 elencos com posição | Liquipedia ×3 fontes |

**As linhas de Core e Suporte do Reddit são SOMAS da dupla** — a nota da função é a
média, então dividimos por 2 em `data/load.ts`. O arquivo cru fica intocado.

### Duas armadilhas de nome que custam caro

**A Valve faz orgs patrocinadas por casa de aposta jogarem sob apelido no TI:**
TEAM VISION = **PariVision**, BoomBoys = **BetBoom**, Iron Wing = **1w Team**,
HULIGANI = **L1GA**. Eu errei essa e tratei a campeã do EWC 2026 como desconhecida.

**Rating de organização mente sobre o elenco atual.** O Elo 1430 do Team Liquid vem de
**3.132 partidas de histórico da org**, não dos cinco que vão jogar. O Iron Wing marca
1280 com 30 jogos, mas os *jogadores* são a ex-Tundra que ganhou Birmingham e a DL29.
E a "Tundra Esports" hoje tem Topson e RAMZES666 — cinco pessoas diferentes. Por isso a
fonte primária é o **mercado de apostas**, que precifica quem entra em quadra.

---

## Como o motor decide

**Nível do battlepass, delta de time do Reddit.** `estimativa = médiaDaLiga + w·k·deltaDoTime`,
com `w = n/(n+n₀)` empírico-Bayes. O fator de escala medido dá **1,02** nas três funções,
o que confirma a divisão por dupla com fonte independente.

**Amostra estimada, não chutada.** Para os times sem contagem publicada, o tamanho de
amostra sai da razão `topo/média` da tabela do Reddit — `E[máximo de n]` cresce com `n`.
Calibrado contra quem tem contagem conhecida: **r = 0,69 / 0,68 / 0,52**.

**Correção de força de tabela.** Mediu-se, por stat, o z médio de quem entrou no top-8
TI-relevante menos o de quem ficou de fora. Poucas Mortes no Meio dá **−0,60**; Tormentor
no Principal, **−0,98**. Morrer pouco e pegar objetivo de graça são marcas de oposição
fraca. A correção é **assimétrica** (só penaliza) porque a direção positiva está
confundida com o estandarte de referência do battlepass.

**Recomendação no p75, não na média nem no melhor caso.** O "melhor estandarte" é um
máximo sobre ~200 atribuições ruidosas — quem vence tende a ser quem carrega o maior erro
de estimativa. Medido: OG no Meio vai de 16º na média a 4º no máximo **sem subir no meio
do caminho**. Maldição do vencedor clássica, e foi cortado.

**Otimizador exato.** 9.216 candidatos × 64 títulos em ~200 ms. As funções não são
independentes porque o título vale para os 5 jogadores, mas com o título *fixado* elas
voltam a ser separáveis — então é laço externo nos títulos, e cada função escolhe seu
próprio máximo. Sem poda, sem heurística.

---

## Verificação

O teste-oráculo reproduz os **4 ganhos de título publicados pelo battlepass.ru** dentro de
2%, validando de uma vez unidades, mistura de fontes, modelo de treinador e a regra da
média. A validação cruzada mais forte: a taxa de herói azul implicada pelo ganho do Cerúleo
(battlepass, 0,3234) bate com a média da nossa tabela do Reddit (0,3153) — **2,5% entre
fontes que não se falam**.

44 testes. Guarda de NaN na enumeração inteira, saída determinística bit a bit,
`Math.random` e `Date.now` proibidos em `engine/`.

A validacao mais forte veio de fora: o print do estandarte real de um jogador reproduz
as **nove porcentagens** exatamente, incluindo o mesmo traco Fractal valendo +80% num
estandarte e +20% noutro — porque num os tres niveis sao distintos e no outro nao.

Duas armadilhas do jogo foram **descobertas por teste de propriedade** e estão fixadas:
subir uma qualidade pode piorar o estandarte (quebra o Fractal), e trocar um traço por
Benevolente pode piorar os vizinhos (quebra o degrau do Amigável).

---

## O que eu NÃO garanto

- **Os coeficientes de variação por stat e a correlação de 0,55 dentro das duplas são
  suposições minhas.** Ninguém publicou isso. É delas que sai a conclusão de que o Meio
  pontua mais que o Principal.
- **Nenhuma probabilidade de reroll é publicada por ninguém.** Por isso a orientação de
  fichas vem das *regras*, não de um modelo de EV inventado.
- **Os Palpites acertam ~5 de 16**, contra 3,75 de quem chuta. Não é o modelo sendo ruim:
  dez dos 16 times caem na eliminatória, onde ganhar ou perder é cara-ou-coroa.

---

## Rodando

```bash
npm install
npm run dev          # tela cheia; teclas 1 2 G T trocam de cena, L troca o idioma
npm test             # 44 testes

npx vite-node scripts/cola.ts       # a cola no terminal
npx vite-node scripts/palpites.ts   # os 16 palpites com estabilidade
npx vite-node scripts/report.ts     # auditoria dos dados
node scripts/fetch-portraits.mjs    # rebaixa fotos do CDN da Valve
node scripts/optimize-images.mjs    # reduz 71 MB -> 1,4 MB
```

Fotos e logos são os oficiais da Valve:
`cdn.cloudflare.steamstatic.com/apps/dota2/players/{account_id}.png` e o `logo_url` da
OpenDota. Dois caminhos parecidos **não** servem: `images/players/` só tem 19 dos 80, e
`images/team_logos/` só responde para as orgs antigas.

## Licença

MIT no código. Os dados são agregados de fontes públicas, creditadas acima — se você usar,
credite elas também.
