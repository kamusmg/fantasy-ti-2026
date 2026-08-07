/**
 * Reduz as fotos baixadas do CDN da Valve.
 *
 * O original tem 71 MB (retratos de corpo inteiro em ate 2,6 MB cada). Na tela
 * eles aparecem entre 138 e 176 px, entao 400 px de largura ja cobre telas
 * retina com folga. Em WebP isso derruba o peso em ~95%.
 *
 * Nao e capricho: numa live, centenas de pessoas abrem o link ao mesmo tempo, e
 * a diferenca entre 71 MB e 4 MB e a diferenca entre a pagina abrir e nao abrir.
 *
 * O recorte e pelo TOPO porque as fotos sao de corpo inteiro e o que interessa e
 * o rosto — mesmo `object-position` que a tela usa, so que aplicado no arquivo.
 */
import { readdirSync, statSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const JOBS = [
  { dir: join(ROOT, 'public', 'players'), width: 400, height: 400, fit: 'cover', position: 'top', quality: 82 },
  { dir: join(ROOT, 'public', 'teams'), width: 220, height: 220, fit: 'inside', position: 'centre', quality: 90 },
];

const mb = (n) => (n / 1024 / 1024).toFixed(1);

for (const job of JOBS) {
  if (!existsSync(job.dir)) {
    console.log(`pulando ${basename(job.dir)}: pasta nao existe (rode fetch-portraits.mjs antes)`);
    continue;
  }

  const files = readdirSync(job.dir).filter((f) => extname(f).toLowerCase() === '.png');
  const tmp = `${job.dir}-tmp`;
  mkdirSync(tmp, { recursive: true });

  let before = 0;
  let after = 0;

  for (const file of files) {
    const src = join(job.dir, file);
    before += statSync(src).size;
    const out = join(tmp, `${basename(file, '.png')}.webp`);

    await sharp(src)
      .resize(job.width, job.height, { fit: job.fit, position: job.position, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: job.quality })
      .toFile(out);

    after += statSync(out).size;
  }

  rmSync(job.dir, { recursive: true, force: true });
  renameSync(tmp, job.dir);

  console.log(`${basename(job.dir).padEnd(9)} ${String(files.length).padStart(3)} imagens   ${mb(before).padStart(6)} MB -> ${mb(after).padStart(5)} MB`);
}

// O manifesto aponta pra .png; os arquivos viraram .webp. Sem isto, a tela
// pediria caminhos que nao existem mais e cairia na silhueta em todo mundo.
const manifestPath = join(ROOT, 'src', 'data', 'generated', 'portraits.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
for (const group of ['players', 'teams']) {
  for (const [key, value] of Object.entries(manifest[group])) {
    manifest[group][key] = value.replace(/\.png$/, '.webp');
  }
}
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('manifesto atualizado pra .webp');
