/**
 * Gera o favicon e a imagem de preview (Open Graph).
 *
 * A imagem de preview MOSTRA A RESPOSTA — os tres times e o titulo. Quem recebe
 * o link no Discord ja sai sabendo o que tem do outro lado, em vez de ver um
 * retangulo cinza. Preview generico e link que ninguem clica.
 *
 * Gerada a partir do motor, entao se a recomendacao mudar basta rodar de novo.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
mkdirSync(PUBLIC, { recursive: true });

// Lido do arquivo gerado pelo motor pra nao precisar do runtime de TS aqui.
const answer = JSON.parse(process.env.FANTASY_ANSWER ?? '{}');
const core = answer.core ?? 'LGD GAMING';
const mid = answer.mid ?? 'TEAM FALCONS';
const support = answer.support ?? 'LGD GAMING';
// Entidades HTML nos acentos: o rasterizador de SVG e menos previsivel com
// UTF-8 cru dentro de string de template.
const title = answer.title ?? 'CER&#218;LEO &#183; O DECISIVO';

const GOLD = '#e0b86a';
const GOLD_BRIGHT = '#ffe4a3';
const TEXT = '#fdf4e0';
const DIM = '#c8ab7a';

/** Moldura de canto dourada — o mesmo detalhe que os paineis da tela usam. */
const corner = (x, y, sx, sy) => `
  <path d="M ${x} ${y + sy * 34} L ${x} ${y} L ${x + sx * 34} ${y}"
        stroke="${GOLD}" stroke-width="4" fill="none" opacity="0.9"/>`;

const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="bg" cx="50%" cy="0%" r="110%">
      <stop offset="0%" stop-color="#5c3d1a"/>
      <stop offset="55%" stop-color="#33200c"/>
      <stop offset="100%" stop-color="#1b1006"/>
    </radialGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${GOLD}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="26" y="26" width="1148" height="578" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.45"/>
  ${corner(26, 26, 1, 1)}${corner(1174, 26, -1, 1)}${corner(26, 604, 1, -1)}${corner(1174, 604, -1, -1)}

  <text x="600" y="98" text-anchor="middle" font-family="Georgia, serif" font-size="30"
        letter-spacing="11" fill="${GOLD}">FANTASY TI 2026</text>
  <rect x="370" y="122" width="460" height="2" fill="url(#rule)"/>
  <text x="600" y="164" text-anchor="middle" font-family="Georgia, serif" font-size="22"
        letter-spacing="7" fill="${DIM}">A ESCALA&#199;&#195;O &#183; FASE DE GRUPOS</text>

  <text x="600" y="240" text-anchor="middle" font-family="Georgia, serif" font-size="19"
        letter-spacing="6" fill="${GOLD}">PRINCIPAL</text>
  <text x="600" y="292" text-anchor="middle" font-family="Georgia, serif" font-size="48"
        font-weight="bold" fill="${GOLD_BRIGHT}">${core}</text>

  <text x="600" y="348" text-anchor="middle" font-family="Georgia, serif" font-size="19"
        letter-spacing="6" fill="${GOLD}">MEIO</text>
  <text x="600" y="400" text-anchor="middle" font-family="Georgia, serif" font-size="48"
        font-weight="bold" fill="${GOLD_BRIGHT}">${mid}</text>

  <text x="600" y="456" text-anchor="middle" font-family="Georgia, serif" font-size="19"
        letter-spacing="6" fill="${GOLD}">SUPORTE</text>
  <text x="600" y="508" text-anchor="middle" font-family="Georgia, serif" font-size="48"
        font-weight="bold" fill="${GOLD_BRIGHT}">${support}</text>

  <rect x="330" y="536" width="540" height="1" fill="url(#rule)"/>
  <text x="600" y="576" text-anchor="middle" font-family="Georgia, serif" font-size="26"
        letter-spacing="3" fill="${TEXT}">${title}</text>
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
console.log(`  preview mostra: ${core} / ${mid} / ${support}`);
