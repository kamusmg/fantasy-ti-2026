# Guia Fantasy — Função + Ranking de Atributos (TI 2026)

> **ARQUIVO GERADO — não edite à mão.** `npx vite-node scripts/gen-guia.ts`
>
> Os números saem do mesmo motor que a tela `#guia` do site, então guia e site
> não têm como divergir. A versão anterior deste arquivo era escrita à mão e
> divergia: faltavam 9 dos 18 atributos e seis posições estavam invertidas.

Período: **Fase de Grupos**. Medido na equipe líder de cada função — no site dá pra
trocar a equipe e ver o ranking dela.

## Como ler

**Top / Médio / Ruim** são o veredito do motor, em fração do valor do MELHOR atributo
daquela cor: **Top ≥ 90%** (guarde), **Médio ≥ 72%** (aceitável), abaixo disso **renove**.
Os cortes são regra de bolso, não medida: ninguém publica a distribuição de resultado
de um reroll. O que os sustenta é que, com 6 atributos por cor e o reroll garantindo
atributo NOVO, trocar troca pela média dos outros cinco — se o que você tem já está
acima dessa média, trocar tem valor esperado negativo.

**valor/mapa** é a estimativa de pontos de fantasy por mapa daquele atributo, para os
jogadores daquela função naquela equipe. É por isso que a mesma stat vale coisas
diferentes em funções diferentes.

Os nomes vêm da localização oficial da Valve. O cliente usa **duas grafias**: uma no
glossário de pontuação e outra, mais curta, na plaquinha do emblema — as duas estão
aqui, porque é a da plaquinha que você lê na hora de decidir o reroll.

## O encaixe do estandarte (Fase de Grupos)

- **PRINCIPAL:** Vermelho / Verde / Vermelho
- **MEIO:** Vermelho / Azul / Verde
- **SUPORTE:** Azul / Verde / Azul

A cor vem **travada pela função** — você não escolhe. O Principal não tem emblema azul
e o Suporte não tem emblema vermelho, então atributo daquela cor simplesmente não pode
cair no estandarte deles.

# Parte 1 — A REGRA GERAL (média da liga)

**É por aqui que se começa.** São 2.888 replays de 14 ligas, sem equipe nenhuma no meio.
Foi o que a versão escrita à mão tentava dizer, e é o que o site agora mostra por padrão.

---

## PRINCIPAL

Média da liga — **2.888 replays de 14 ligas**, sem equipe nenhuma.

### Vermelho ×2

**Top:** Criaturas, OPM, Mortes · **Ruim:** Lascas de Insanite, Vítimas, Torres Destruídas

> **Empate técnico entre os 3 primeiros.** A diferença entre eles é menor que o erro
> do próprio modelo — ali não existe "o melhor", fique com o que caiu.

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 = | Criaturas | Finalizações | 1311 | 100% | Top |
| 2 = | OPM | OPM | 1296 | 99% | Top |
| 3 = | Mortes | Mortes | 1203 | 92% | Top |
| 4 | Lascas de Insanite | Lascas de insanite | 733 | 56% | Ruim |
| 5 | Vítimas | Vítimas | 717 | 55% | Ruim |
| 6 | Torres Destruídas | Torres destr. | 687 | 52% | Ruim |

### Verde ×1

**Top:** Participação em Batalhas · **Ruim:** Tormentas Destruídas, Roshans Mortos, Atordoamentos, Primeira Vítima, Entregadores Mortos

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 | Participação em Batalhas | Bat. equipes | 1315 | 100% | Top |
| 2 | Tormentas Destruídas | Tormentas destruídas | 684 | 52% | Ruim |
| 3 | Roshans Mortos | Roshans mortos | 528 | 40% | Ruim |
| 4 | Atordoamentos | Atordoam. | 298 | 23% | Ruim |
| 5 | Primeira Vítima | 1ª vítima | 199 | 15% | Ruim |
| 6 | Entregadores Mortos | Entregadores mortos | 175 | 13% | Ruim |

### Ranking geral da função

Todas as cores do estandarte juntas, em ordem de valor por mapa. **Não é uma lista de
escolha:** a cor de cada emblema é fixa, então não existe trocar um vermelho por um
verde. Serve pra saber o que dá mais alegria ver cair.

| # | Atributo | Cor | valor/mapa |
|---|---|---|---|
| 1 | Participação em Batalhas | Verde | 1315 |
| 2 | Criaturas | Vermelho | 1311 |
| 3 | OPM | Vermelho | 1296 |
| 4 | Mortes | Vermelho | 1203 |
| 5 | Lascas de Insanite | Vermelho | 733 |
| 6 | Vítimas | Vermelho | 717 |
| 7 | Torres Destruídas | Vermelho | 687 |
| 8 | Tormentas Destruídas | Verde | 684 |
| 9 | Roshans Mortos | Verde | 528 |
| 10 | Atordoamentos | Verde | 298 |
| 11 | Primeira Vítima | Verde | 199 |
| 12 | Entregadores Mortos | Verde | 175 |

---

## MEIO

Média da liga — **2.888 replays de 14 ligas**, sem equipe nenhuma.

### Vermelho ×1

**Top:** Mortes, OPM, Criaturas · **Ruim:** Vítimas, Lascas de Insanite, Torres Destruídas

> **Empate técnico entre os 3 primeiros.** A diferença entre eles é menor que o erro
> do próprio modelo — ali não existe "o melhor", fique com o que caiu.

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 = | Mortes | Mortes | 1225 | 100% | Top |
| 2 = | OPM | OPM | 1220 | 100% | Top |
| 3 = | Criaturas | Finalizações | 1193 | 97% | Top |
| 4 | Vítimas | Vítimas | 787 | 64% | Ruim |
| 5 | Lascas de Insanite | Lascas de insanite | 494 | 40% | Ruim |
| 6 | Torres Destruídas | Torres destr. | 387 | 32% | Ruim |

### Azul ×1

**Top:** Runas Obtidas · **Ruim:** Acampamentos Acumulados, Lótus Obtidos, Vigias Ativados, Sentinelas Posicionadas, Fumaças Usadas

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 | Runas Obtidas | Runas obtidas | 1434 | 100% | Top |
| 2 | Acampamentos Acumulados | Acamp. acu. | 465 | 32% | Ruim |
| 3 | Lótus Obtidos | Lótus obtidos | 212 | 15% | Ruim |
| 4 | Vigias Ativados | Vigias ativados | 178 | 12% | Ruim |
| 5 | Sentinelas Posicionadas | Sent. Obs. | 175 | 12% | Ruim |
| 6 | Fumaças Usadas | Fumaças usadas | 14 | 1% | Ruim |

### Verde ×1

**Top:** Participação em Batalhas · **Ruim:** Tormentas Destruídas, Atordoamentos, Roshans Mortos, Entregadores Mortos, Primeira Vítima

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 | Participação em Batalhas | Bat. equipes | 1484 | 100% | Top |
| 2 | Tormentas Destruídas | Tormentas destruídas | 464 | 31% | Ruim |
| 3 | Atordoamentos | Atordoam. | 348 | 23% | Ruim |
| 4 | Roshans Mortos | Roshans mortos | 289 | 19% | Ruim |
| 5 | Entregadores Mortos | Entregadores mortos | 206 | 14% | Ruim |
| 6 | Primeira Vítima | 1ª vítima | 115 | 8% | Ruim |

### Ranking geral da função

Todas as cores do estandarte juntas, em ordem de valor por mapa. **Não é uma lista de
escolha:** a cor de cada emblema é fixa, então não existe trocar um vermelho por um
verde. Serve pra saber o que dá mais alegria ver cair.

| # | Atributo | Cor | valor/mapa |
|---|---|---|---|
| 1 | Participação em Batalhas | Verde | 1484 |
| 2 | Runas Obtidas | Azul | 1434 |
| 3 | Mortes | Vermelho | 1225 |
| 4 | OPM | Vermelho | 1220 |
| 5 | Criaturas | Vermelho | 1193 |
| 6 | Vítimas | Vermelho | 787 |
| 7 | Lascas de Insanite | Vermelho | 494 |
| 8 | Acampamentos Acumulados | Azul | 465 |
| 9 | Tormentas Destruídas | Verde | 464 |
| 10 | Torres Destruídas | Vermelho | 387 |
| 11 | Atordoamentos | Verde | 348 |
| 12 | Roshans Mortos | Verde | 289 |
| 13 | Lótus Obtidos | Azul | 212 |
| 14 | Entregadores Mortos | Verde | 206 |
| 15 | Vigias Ativados | Azul | 178 |
| 16 | Sentinelas Posicionadas | Azul | 175 |
| 17 | Primeira Vítima | Verde | 115 |
| 18 | Fumaças Usadas | Azul | 14 |

---

## SUPORTE

Média da liga — **2.888 replays de 14 ligas**, sem equipe nenhuma.

### Azul ×2

**Top:** Sentinelas Posicionadas · **Médio:** Fumaças Usadas, Acampamentos Acumulados, Vigias Ativados · **Ruim:** Lótus Obtidos, Runas Obtidas

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 | Sentinelas Posicionadas | Sent. Obs. | 1049 | 100% | Top |
| 2 | Fumaças Usadas | Fumaças usadas | 942 | 90% | Médio |
| 3 | Acampamentos Acumulados | Acamp. acu. | 893 | 85% | Médio |
| 4 | Vigias Ativados | Vigias ativados | 872 | 83% | Médio |
| 5 | Lótus Obtidos | Lótus obtidos | 629 | 60% | Ruim |
| 6 | Runas Obtidas | Runas obtidas | 419 | 40% | Ruim |

### Verde ×1

**Top:** Participação em Batalhas · **Ruim:** Tormentas Destruídas, Atordoamentos, Entregadores Mortos, Primeira Vítima, Roshans Mortos

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 | Participação em Batalhas | Bat. equipes | 1410 | 100% | Top |
| 2 | Tormentas Destruídas | Tormentas destruídas | 428 | 30% | Ruim |
| 3 | Atordoamentos | Atordoam. | 407 | 29% | Ruim |
| 4 | Entregadores Mortos | Entregadores mortos | 299 | 21% | Ruim |
| 5 | Primeira Vítima | 1ª vítima | 222 | 16% | Ruim |
| 6 | Roshans Mortos | Roshans mortos | 55 | 4% | Ruim |

### Ranking geral da função

Todas as cores do estandarte juntas, em ordem de valor por mapa. **Não é uma lista de
escolha:** a cor de cada emblema é fixa, então não existe trocar um vermelho por um
verde. Serve pra saber o que dá mais alegria ver cair.

| # | Atributo | Cor | valor/mapa |
|---|---|---|---|
| 1 | Participação em Batalhas | Verde | 1410 |
| 2 | Sentinelas Posicionadas | Azul | 1049 |
| 3 | Fumaças Usadas | Azul | 942 |
| 4 | Acampamentos Acumulados | Azul | 893 |
| 5 | Vigias Ativados | Azul | 872 |
| 6 | Lótus Obtidos | Azul | 629 |
| 7 | Tormentas Destruídas | Verde | 428 |
| 8 | Runas Obtidas | Azul | 419 |
| 9 | Atordoamentos | Verde | 407 |
| 10 | Entregadores Mortos | Verde | 299 |
| 11 | Primeira Vítima | Verde | 222 |
| 12 | Roshans Mortos | Verde | 55 |

# Parte 2 — O CASO DE CADA EQUIPE RECOMENDADA

Os mesmos atributos, medidos na equipe que o motor recomenda para cada função. **Isto é
um caso, não a regra** — e a diferença importa: no azul do Suporte, a LGD é uma das DUAS
equipes (de 16) em que Vigias Ativados passa Sentinelas Posicionadas. Ler o caso como se
fosse a regra é exatamente o erro que este arquivo já cometeu.

---

## PRINCIPAL

Medido em **TEAM VISION** — Satanic e Noticed.

### Vermelho ×2

**Top:** OPM, Criaturas, Mortes · **Ruim:** Lascas de Insanite, Vítimas, Torres Destruídas

> **Empate técnico entre os 3 primeiros.** A diferença entre eles é menor que o erro
> do próprio modelo — ali não existe "o melhor", fique com o que caiu.

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 = | OPM | OPM | 1338 | 100% | Top |
| 2 = | Criaturas | Finalizações | 1334 | 100% | Top |
| 3 = | Mortes | Mortes | 1303 | 97% | Top |
| 4 | Lascas de Insanite | Lascas de insanite | 770 | 58% | Ruim |
| 5 | Vítimas | Vítimas | 764 | 57% | Ruim |
| 6 | Torres Destruídas | Torres destr. | 713 | 53% | Ruim |

### Verde ×1

**Top:** Participação em Batalhas · **Ruim:** Tormentas Destruídas, Roshans Mortos, Atordoamentos, Primeira Vítima, Entregadores Mortos

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 | Participação em Batalhas | Bat. equipes | 1297 | 100% | Top |
| 2 | Tormentas Destruídas | Tormentas destruídas | 682 | 53% | Ruim |
| 3 | Roshans Mortos | Roshans mortos | 537 | 41% | Ruim |
| 4 | Atordoamentos | Atordoam. | 298 | 23% | Ruim |
| 5 | Primeira Vítima | 1ª vítima | 199 | 15% | Ruim |
| 6 | Entregadores Mortos | Entregadores mortos | 147 | 11% | Ruim |

### Ranking geral da função

Todas as cores do estandarte juntas, em ordem de valor por mapa. **Não é uma lista de
escolha:** a cor de cada emblema é fixa, então não existe trocar um vermelho por um
verde. Serve pra saber o que dá mais alegria ver cair.

| # | Atributo | Cor | valor/mapa |
|---|---|---|---|
| 1 | OPM | Vermelho | 1338 |
| 2 | Criaturas | Vermelho | 1334 |
| 3 | Mortes | Vermelho | 1303 |
| 4 | Participação em Batalhas | Verde | 1297 |
| 5 | Lascas de Insanite | Vermelho | 770 |
| 6 | Vítimas | Vermelho | 764 |
| 7 | Torres Destruídas | Vermelho | 713 |
| 8 | Tormentas Destruídas | Verde | 682 |
| 9 | Roshans Mortos | Verde | 537 |
| 10 | Atordoamentos | Verde | 298 |
| 11 | Primeira Vítima | Verde | 199 |
| 12 | Entregadores Mortos | Verde | 147 |

---

## MEIO

Medido em **Team Falcons** — Malr1ne.

### Vermelho ×1

**Top:** Criaturas, OPM, Mortes · **Ruim:** Vítimas, Lascas de Insanite, Torres Destruídas

> **Empate técnico entre os 3 primeiros.** A diferença entre eles é menor que o erro
> do próprio modelo — ali não existe "o melhor", fique com o que caiu.

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 = | Criaturas | Finalizações | 1229 | 100% | Top |
| 2 = | OPM | OPM | 1229 | 100% | Top |
| 3 = | Mortes | Mortes | 1193 | 97% | Top |
| 4 | Vítimas | Vítimas | 833 | 68% | Ruim |
| 5 | Lascas de Insanite | Lascas de insanite | 559 | 45% | Ruim |
| 6 | Torres Destruídas | Torres destr. | 426 | 35% | Ruim |

### Azul ×1

**Top:** Runas Obtidas · **Ruim:** Acampamentos Acumulados, Lótus Obtidos, Vigias Ativados, Sentinelas Posicionadas, Fumaças Usadas

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 | Runas Obtidas | Runas obtidas | 1434 | 100% | Top |
| 2 | Acampamentos Acumulados | Acamp. acu. | 465 | 32% | Ruim |
| 3 | Lótus Obtidos | Lótus obtidos | 212 | 15% | Ruim |
| 4 | Vigias Ativados | Vigias ativados | 178 | 12% | Ruim |
| 5 | Sentinelas Posicionadas | Sent. Obs. | 175 | 12% | Ruim |
| 6 | Fumaças Usadas | Fumaças usadas | 14 | 1% | Ruim |

### Verde ×1

**Top:** Participação em Batalhas · **Ruim:** Tormentas Destruídas, Atordoamentos, Roshans Mortos, Primeira Vítima, Entregadores Mortos

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 | Participação em Batalhas | Bat. equipes | 1487 | 100% | Top |
| 2 | Tormentas Destruídas | Tormentas destruídas | 682 | 46% | Ruim |
| 3 | Atordoamentos | Atordoam. | 499 | 34% | Ruim |
| 4 | Roshans Mortos | Roshans mortos | 340 | 23% | Ruim |
| 5 | Primeira Vítima | 1ª vítima | 184 | 12% | Ruim |
| 6 | Entregadores Mortos | Entregadores mortos | 182 | 12% | Ruim |

### Ranking geral da função

Todas as cores do estandarte juntas, em ordem de valor por mapa. **Não é uma lista de
escolha:** a cor de cada emblema é fixa, então não existe trocar um vermelho por um
verde. Serve pra saber o que dá mais alegria ver cair.

| # | Atributo | Cor | valor/mapa |
|---|---|---|---|
| 1 | Participação em Batalhas | Verde | 1487 |
| 2 | Runas Obtidas | Azul | 1434 |
| 3 | Criaturas | Vermelho | 1229 |
| 4 | OPM | Vermelho | 1229 |
| 5 | Mortes | Vermelho | 1193 |
| 6 | Vítimas | Vermelho | 833 |
| 7 | Tormentas Destruídas | Verde | 682 |
| 8 | Lascas de Insanite | Vermelho | 559 |
| 9 | Atordoamentos | Verde | 499 |
| 10 | Acampamentos Acumulados | Azul | 465 |
| 11 | Torres Destruídas | Vermelho | 426 |
| 12 | Roshans Mortos | Verde | 340 |
| 13 | Lótus Obtidos | Azul | 212 |
| 14 | Primeira Vítima | Verde | 184 |
| 15 | Entregadores Mortos | Verde | 182 |
| 16 | Vigias Ativados | Azul | 178 |
| 17 | Sentinelas Posicionadas | Azul | 175 |
| 18 | Fumaças Usadas | Azul | 14 |

---

## SUPORTE

Medido em **LGD Gaming** — Thiolicor e KJ.

### Azul ×2

**Top:** Vigias Ativados, Acampamentos Acumulados, Sentinelas Posicionadas · **Médio:** Fumaças Usadas · **Ruim:** Lótus Obtidos, Runas Obtidas

> **Empate técnico entre os 3 primeiros.** A diferença entre eles é menor que o erro
> do próprio modelo — ali não existe "o melhor", fique com o que caiu.

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 = | Vigias Ativados | Vigias ativados | 1233 | 100% | Top |
| 2 = | Acampamentos Acumulados | Acamp. acu. | 1171 | 95% | Top |
| 3 = | Sentinelas Posicionadas | Sent. Obs. | 1132 | 92% | Top |
| 4 | Fumaças Usadas | Fumaças usadas | 954 | 77% | Médio |
| 5 | Lótus Obtidos | Lótus obtidos | 880 | 71% | Ruim |
| 6 | Runas Obtidas | Runas obtidas | 711 | 58% | Ruim |

### Verde ×1

**Top:** Participação em Batalhas · **Ruim:** Entregadores Mortos, Atordoamentos, Tormentas Destruídas, Primeira Vítima, Roshans Mortos

| # | Atributo | Na plaquinha | valor/mapa | % do melhor | veredito |
|---|---|---|---|---|---|
| 1 | Participação em Batalhas | Bat. equipes | 1377 | 100% | Top |
| 2 | Entregadores Mortos | Entregadores mortos | 481 | 35% | Ruim |
| 3 | Atordoamentos | Atordoam. | 442 | 32% | Ruim |
| 4 | Tormentas Destruídas | Tormentas destruídas | 393 | 29% | Ruim |
| 5 | Primeira Vítima | 1ª vítima | 199 | 14% | Ruim |
| 6 | Roshans Mortos | Roshans mortos | 78 | 6% | Ruim |

### Ranking geral da função

Todas as cores do estandarte juntas, em ordem de valor por mapa. **Não é uma lista de
escolha:** a cor de cada emblema é fixa, então não existe trocar um vermelho por um
verde. Serve pra saber o que dá mais alegria ver cair.

| # | Atributo | Cor | valor/mapa |
|---|---|---|---|
| 1 | Participação em Batalhas | Verde | 1377 |
| 2 | Vigias Ativados | Azul | 1233 |
| 3 | Acampamentos Acumulados | Azul | 1171 |
| 4 | Sentinelas Posicionadas | Azul | 1132 |
| 5 | Fumaças Usadas | Azul | 954 |
| 6 | Lótus Obtidos | Azul | 880 |
| 7 | Runas Obtidas | Azul | 711 |
| 8 | Entregadores Mortos | Verde | 481 |
| 9 | Atordoamentos | Verde | 442 |
| 10 | Tormentas Destruídas | Verde | 393 |
| 11 | Primeira Vítima | Verde | 199 |
| 12 | Roshans Mortos | Verde | 78 |

---

## O que a versão escrita à mão errava

Guardado aqui de propósito: a tabela antiga circulou como referência, e quem a viu
precisa saber o que trocar de ideia.

| onde | a tabela dizia | o motor mede |
|---|---|---|
| Suporte, azul | listava "Lascas" | Lascas é **vermelho** — não existe nesse estandarte |
| Meio, vermelho | Vítimas Top, Mortes Médio | **Mortes** vale mais que **Vítimas** |
| Meio, azul | Acampamentos Ruim, Vigias Médio | **Acampamentos** vale mais que **Vigias** |
| Meio, azul | não citava Fumaças | é o **piso** da cor |
| Principal, vermelho | Lascas Ruim, Torres Médio | **Lascas** vale mais que **Torres** |
| Suporte, verde | não citava Entregadores | é o **segundo** da cor |
| geral | "Ruim: RNG" | RNG não é atributo |

### E o que EU errei ao corrigi-la

Numa versão anterior deste arquivo eu escrevi que a tabela errava por **não citar Vigias
Ativados como o melhor azul do Suporte**. Isso está errado, e o erro é meu: eu li o número
da LGD — a equipe recomendada, e portanto a que a tela abria — e o apresentei como fato da
liga. Na média das 14 ligas o melhor azul do Suporte é **Sentinelas Posicionadas**, e
Vigias lidera em apenas **2 das 16** equipes. A tabela escrita à mão estava CERTA nesse
ponto.

A causa não era o cálculo: era a tela abrir travada numa equipe. Por isso o padrão do
seletor virou a média da liga, e a lista de equipes virou ordem alfabética, sem estrela.
**Lei: quando a tela abre num caso, ela ensina o caso como se fosse a regra.**

Nomes trocados: *Pedras Loucas* → **Lascas de Insanite**, *Abates* → **Vítimas**,
*Poucas Mortes* → **Mortes**, *Stacks* → **Acampamentos Acumulados**,
*Smoke of Deceit* → **Fumaças Usadas**, *Sentinelas (Wards Placed)* → na plaquinha
do emblema é **Sent. Obs.**

