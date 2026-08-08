> **DOCUMENTO HISTÓRICO.** Foi o ponto de partida do projeto, escrito antes do
> motor existir. Várias premissas daqui foram medidas depois e não se sustentaram
> — a arquitetura que ficou está no `README.md`. Guardado porque explica de onde
> o projeto veio, não como ele funciona hoje.

# 🚀 HANDOFF: INSTRUÇÕES DE ARQUITETURA E LÓGICA (DE GEMINI PARA CLAUDE OPUS)

Saudações, Claude. Aqui é o Gemini 2.5. 
O desenvolvedor (Kamus) pediu que eu preparasse o terreno e fizesse uma revisão pesada na lógica matemática do "Dota dos Sonhos" (Fantasy) do TI 2026, pois a versão visual e matemática inicial estava desalinhada com as regras de *min-maxing* do próprio jogo.

Eu já realizei o levantamento matemático pesado. Agora, a missão de **implementar a UI e a lógica de software no site** é sua.

## 📂 O QUE EU JÁ FIZ (O SEU PONTO DE PARTIDA)

Deixei tudo mastigado no repositório (`d:\projetos D\fantasy\`). **Você DEVE ler estes arquivos antes de alterar qualquer código:**

1. `GUIA_ATRIBUTOS_2026.md`: O ranking definitivo (Top/Médio/Ruim) de emblemas e cores. (A regra de ouro é: Core=R/G/R, Mid=R/B/G, Support=B/G/B).
2. `GLOSSARIO_PONTUACAO_2026.md`: Os multiplicadores base exatos extraídos do jogo (ex: +141 por Runa, -195 por morte, regras do Nível V).
3. `EQUIPE_DOS_SONHOS_2026.md`: A minha escalação Min-Max com a prova matemática de que misturar *Vampírico* e *Benevolente* no Nível V quebra o teto de pontuação de Wards e Runas.
4. **Palpites na Engine:** Adicionei minha grade de 16 times no array de pros em `src/data/raw/proPicks.json` (usando o id `gemini`). Troquei zebras sul-americanas (LGD) por times de consistência.

---

## 💻 SUA MISSÃO AGORA (A IMPLEMENTAÇÃO NO REACT)

O usuário (Kamus) considerou a estrutura atual do "Dream Team" superficial. Ele quer que você implemente a versão visual definitiva no React do site. Seus objetivos são:

### 1. Corrigir o "Seu" Dream Team (Claude)
Use a documentação que criei para rever as suas escolhas matemáticas (que provavelmente estão em arquivos hardcoded ou em geradores). Se quiser competir com o meu Dream Team, você precisará otimizar seus modificadores considerando a interação entre Traços (Amigável, Vampírico, Benevolente, Único e Fractal).

### 2. Implementar os Dados da Equipe dos Sonhos (Dream Team)
A estrutura visual do site já está pronta. O seu foco deve ser estritamente na injeção do **conteúdo** e no cálculo matemático dos modificadores. 
Você precisa garantir que o componente de "Equipe dos Sonhos" (seja no `PredictionsScene.tsx` ou view equivalente) processe e exiba as seguintes informações reais extraídas dos nossos cálculos:
- **3 painéis verticais** (Principal, Meio, Suporte) devidamente populados com os jogadores e atributos.
- **CRÍTICO:** Exibir corretamente o **NÍVEL (I a V)** de cada emblema, o **TRAÇO** (ex: Vampírico, Benevolente), e a **porcentagem matemática final do bônus calculada** (ex: `+240%`). Não deixe hardcoded, faça a lógica refletir as fórmulas do `EQUIPE_DOS_SONHOS_2026.md`.

### 3. Regras de Código e Arquitetura do Projeto
- **TypeScript & Vite:** Cuidado com o erro fatal de importação no Vite. Sempre que for importar uma interface ou tipo estrito, use **`import type { MinhaInterface } ...`**. Esquecer o `type` causará tela branca no build.
- **Integração de Perfis:** O estado de qual IA ou Pro-player está sendo visualizado é governado pelo hook `useFantasyEngine.ts`. A tela do "Dream Team" precisa puxar as informações corretas e reagir quando o usuário alternar os perfis.

Leia os arquivos, monte o plano no seu contexto, e crie o código definitivo! 
*Ass: Gemini*
