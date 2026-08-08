/**
 * Gera o favicon e a imagem de preview (Open Graph).
 *
 * A versao anterior desta imagem MOSTRAVA A RESPOSTA — os tres times e o titulo
 * do treinador, lidos do motor. Duas coisas deram errado com isso, e as duas sao
 * o mesmo erro:
 *
 * 1. ENVELHECEU EM SILENCIO. A imagem so se atualiza quando alguem roda este
 *    script, e o motor muda quando os dados mudam. Ela ficou meses anunciando
 *    "LGD GAMING / TEAM FALCONS / LGD GAMING" e "CERULEO . O DECISIVO" — uma
 *    escalacao que o motor nao recomenda mais e um titulo na ordem errada. Todo
 *    link colado no Discord nesse periodo divulgou uma resposta velha.
 * 2. NAO ERA IMPARCIAL. Repetir LGD em duas das tres linhas parece bug ou
 *    torcida, e o site e um COMPARADOR: ele mede escalacoes de varios autores
 *    com a mesma regua. Cravar uma delas no cartao de visita contradiz isso.
 *
 * Entao o preview agora diz o que o site FAZ, nao o que ele responde. Nao cita
 * equipe nenhuma, e por consequencia nao tem como ficar desatualizado.
 *
 * Regra que fica: conteudo gerado que vive FORA do site (preview, cartao,
 * thumbnail) nao pode carregar resultado de calculo — ou ele mente sozinho no
 * dia em que o calculo mudar.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
mkdirSync(PUBLIC, { recursive: true });

const GOLD = '#e0b86a';
const GOLD_BRIGHT = '#ffe4a3';
const TEXT = '#fdf4e0';
const DIM = '#c8ab7a';
const RED = '#e05543';
const BLUE = '#4d94d8';
const GREEN = '#6cbb55';

/** Moldura de canto dourada — o mesmo detalhe que os paineis da tela usam. */
const corner = (x, y, sx, sy) => `
  <path d="M ${x} ${y + sy * 34} L ${x} ${y} L ${x + sx * 34} ${y}"
        stroke="${GOLD}" stroke-width="4" fill="none" opacity="0.9"/>`;

/**
 * Entidades HTML nos acentos de proposito: o rasterizador de SVG e menos
 * previsivel com UTF-8 cru dentro de string de template.
 */
const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="bg" cx="30%" cy="0%" r="120%">
      <stop offset="0%" stop-color="#5c3d1a"/>
      <stop offset="55%" stop-color="#33200c"/>
      <stop offset="100%" stop-color="#1b1006"/>
    </radialGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GOLD_BRIGHT}"/>
      <stop offset="100%" stop-color="#8a6d3a"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- A marca do estandarte, grande e apagada. Nenhum logo de equipe: o site
       compara todas, entao nao pode vestir a camisa de nenhuma. -->
  <g opacity="0.10"><path d="M 15 15 L 32 52 L 49 15 L 40 15 L 32 34 L 24 15 Z"
     fill="url(#mark)" transform="translate(852,126) scale(5.8)"/></g>

  <rect x="26" y="26" width="1148" height="578" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.45"/>
  ${corner(26, 26, 1, 1)}${corner(1174, 26, -1, 1)}${corner(26, 604, 1, -1)}${corner(1174, 604, -1, -1)}

  <text x="90" y="122" font-family="Georgia, serif" font-size="23"
        letter-spacing="9" fill="${GOLD}">DOTA 2 &#183; DOTA DOS SONHOS</text>

  <text x="90" y="228" font-family="Georgia, serif" font-size="74"
        font-weight="bold" fill="${GOLD_BRIGHT}">COLA DO FANTASY</text>

  <text x="94" y="284" font-family="Georgia, serif" font-size="33"
        letter-spacing="6" fill="${GOLD}">THE INTERNATIONAL 2026</text>

  <!-- As tres cores de emblema: quem joga reconhece antes de ler. -->
  <rect x="94" y="316" width="58" height="10" rx="3" fill="${RED}"/>
  <rect x="164" y="316" width="58" height="10" rx="3" fill="${BLUE}"/>
  <rect x="234" y="316" width="58" height="10" rx="3" fill="${GREEN}"/>

  <text x="92" y="396" font-family="Arial, Helvetica, sans-serif" font-size="27"
        fill="${TEXT}">As tr&#234;s equipes por fun&#231;&#227;o, o t&#237;tulo de treinador e onde</text>
  <text x="92" y="436" font-family="Arial, Helvetica, sans-serif" font-size="27"
        fill="${TEXT}">gastar as 40 fichas &#8212; pela conta do pr&#243;prio cliente.</text>
  <text x="92" y="482" font-family="Arial, Helvetica, sans-serif" font-size="24"
        fill="${DIM}">Simulador de estandarte, guia dos 18 atributos e palpites.</text>

  <rect x="92" y="522" width="700" height="1" fill="url(#rule)"/>

  <text x="92" y="568" font-family="Georgia, serif" font-size="26"
        letter-spacing="1" fill="${GOLD}">dota2fantasy.pages.dev</text>
  <rect x="486" y="546" width="248" height="32" rx="4" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.7"/>
  <text x="610" y="568" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16"
        letter-spacing="2" fill="${DIM}">MOTOR E DADOS ABERTOS</text>
</svg>`;

/**
 * Favicon: o "V" invertido do estandarte, em ouro sobre ambar.
 * Simples de proposito — em 16x16 na aba do navegador, detalhe vira borrao.
 */
const favicon = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GOLD_BRIGHT}"/>
      <stop offset="100%" stop-color="#b08d4e"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="10" fill="#2a1a0c"/>
  <rect x="3" y="3" width="58" height="58" rx="8" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.7"/>
  <path d="M 15 15 L 32 52 L 49 15 L 40 15 L 32 34 L 24 15 Z" fill="url(#g)"/>
</svg>`;

writeFileSync(join(PUBLIC, 'favicon.svg'), favicon.trim());
await sharp(Buffer.from(favicon)).resize(180, 180).png().toFile(join(PUBLIC, 'apple-touch-icon.png'));
await sharp(Buffer.from(favicon)).resize(32, 32).png().toFile(join(PUBLIC, 'favicon-32.png'));
await sharp(Buffer.from(og)).png().toFile(join(PUBLIC, 'og.png'));

console.log('favicon.svg, favicon-32.png, apple-touch-icon.png e og.png gerados em public/');
console.log('  o preview nao cita equipe nenhuma — e imparcial e nao envelhece.');
