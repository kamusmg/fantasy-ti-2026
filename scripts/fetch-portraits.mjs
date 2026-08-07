/**
 * Baixa as fotos oficiais dos jogadores e os logos dos times — as MESMAS que o
 * cliente do Dota usa.
 *
 *   foto:  cdn.cloudflare.steamstatic.com/apps/dota2/players/{account_id}.png
 *   logo:  o `logo_url` que a OpenDota devolve por time (Steam UGC)
 *
 * Os dois caminhos foram achados por tentativa. O outro candidato,
 * `images/players/{id}.png`, so tem 19 dos 80 — e o arquivo de TIs antigos.
 * E `images/team_logos/{id}.png` so responde pras orgs velhas (Liquid, Vici, OG);
 * as novas nao estao la, e por isso o logo vem da OpenDota.
 *
 * Baixa pra public/ em vez de linkar direto: numa live, imagem que depende de
 * CDN externo e um ponto de falha em cima do palco. Local carrega sempre.
 *
 * Os account_id vem da OpenDota, casados por apelido com o nosso elenco. Todo
 * jogador nao casado e REPORTADO, nunca silenciado — foto faltando na tela e
 * culpa de casamento de nome, e o script tem que dizer qual.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PLAYERS = join(ROOT, 'public', 'players');
const OUT_TEAMS = join(ROOT, 'public', 'teams');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

/** OpenDota team_id = Valve team_id. Conferidos por elenco, nao por nome. */
const OPENDOTA_TEAM_ID = {
  vision: 9572001,
  yandex: 9823272,
  falcons: 9247354,
  boomboys: 8255888,
  ironwing: 10182357,
  aurora: 9467224,
  spirit: 7119388,
  liquid: 2163,
  vici: 726228,
  xtreme: 8261500,
  resilience: 5017210,
  lgd: 10150538,
  nigma: 10136357,
  og: 2586976,
  gamerlegion: 9964962,
  huligani: 10149530,
};

const teams = JSON.parse(
  await (await import('node:fs/promises')).readFile(join(ROOT, 'src/data/raw/teams.json'), 'utf8'),
).teams;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Normaliza apelido pra casar: o `~`, o `-` e o `` ` `` variam entre fontes. */
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Jogadores que a OpenDota registra com outro apelido. Achados conferindo o
 * elenco atual time a time — nunca por adivinhacao, porque casar nome errado poe
 * a cara de outra pessoa na tela.
 */
const ALIASES = {
  kj: 'kingjungles',
  atf: 'ammarthef',
  malady: 'maladych',
  watson: 'watson',
};

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function download(url, path) {
  if (existsSync(path)) return 'ja tinha';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return `FALHOU ${res.status}`;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) return `FALHOU vazio (${buf.length}b)`;
  writeFileSync(path, buf);
  return `${(buf.length / 1024).toFixed(0)} kB`;
}

mkdirSync(OUT_PLAYERS, { recursive: true });
mkdirSync(OUT_TEAMS, { recursive: true });

const manifest = { players: {}, teams: {} };
const unmatched = [];

for (const team of teams) {
  const openDotaId = OPENDOTA_TEAM_ID[team.id];
  process.stdout.write(`\n${team.name} (${openDotaId})\n`);

  try {
    const meta = await getJson(`https://api.opendota.com/api/teams/${openDotaId}`);
    if (meta.logo_url) {
      const logo = await download(meta.logo_url, join(OUT_TEAMS, `${team.id}.png`));
      if (!logo.startsWith('FALHOU')) manifest.teams[team.id] = `/teams/${team.id}.png`;
      console.log(`  logo: ${logo}`);
    } else {
      console.log('  logo: sem logo_url na OpenDota');
    }
  } catch (e) {
    console.log(`  logo: FALHOU ${e.message}`);
  }
  await sleep(200);

  let roster = [];
  try {
    roster = await getJson(`https://api.opendota.com/api/teams/${openDotaId}/players`);
  } catch (e) {
    console.log(`  ELENCO FALHOU: ${e.message}`);
    unmatched.push(...team.players.map((p) => `${team.name}/${p.nick} (elenco indisponivel)`));
    continue;
  }

  for (const player of team.players) {
    const wanted = ALIASES[norm(player.nick)] ?? norm(player.nick);
    const hit =
      roster.find((r) => r.name && norm(r.name) === wanted) ??
      // Ultimo recurso: apelido contido no nome registrado (o watson vem como
      // "医者watson`"). So entre membros ATUAIS, pra nao pegar ex-jogador.
      roster.find((r) => r.is_current_team_member && r.name && norm(r.name).includes(wanted) && wanted.length >= 4);
    if (!hit) {
      unmatched.push(`${team.name}/${player.nick}`);
      console.log(`  ${player.nick.padEnd(14)} SEM CASAMENTO na OpenDota`);
      continue;
    }
    const status = await download(
      `https://cdn.cloudflare.steamstatic.com/apps/dota2/players/${hit.account_id}.png`,
      join(OUT_PLAYERS, `${player.id}.png`),
    );
    if (!status.startsWith('FALHOU')) manifest.players[player.id] = `/players/${player.id}.png`;
    console.log(`  ${player.nick.padEnd(14)} ${String(hit.account_id).padEnd(11)} ${status}`);
    await sleep(100);
  }
  await sleep(200);
}

writeFileSync(join(ROOT, 'src/data/generated/portraits.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log('\n' + '='.repeat(60));
console.log(`fotos: ${Object.keys(manifest.players).length}/80   logos: ${Object.keys(manifest.teams).length}/16`);
if (unmatched.length > 0) {
  console.log(`\nSEM FOTO (${unmatched.length}):`);
  for (const u of unmatched) console.log(`  ${u}`);
}
