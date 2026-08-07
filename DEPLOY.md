# Publicar

O site é estático (`dist/`, 1,8 MB). Duas formas — a segunda é melhor a longo prazo.

## 1. Direto pelo terminal

O login do wrangler é interativo, então tem que ser você:

```bash
npx wrangler login     # abre o navegador, você autoriza
npm run deploy         # builda e sobe pra fantasyti.pages.dev
```

O `deploy` cria o projeto `fantasyti` na primeira vez. Depois é só repetir o comando
a cada mudança.

## 2. Conectado ao GitHub (recomendado)

Assim cada `git push` republica sozinho, e você nunca mais precisa lembrar de subir.

No painel do Cloudflare → **Workers & Pages** → **Create application** → **Pages** →
**Connect to Git** → repositório `kamusmg/fantasy-ti-2026`, e preencha:

| Campo | Valor |
|---|---|
| Project name | `fantasyti` |
| Production branch | `master` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version (variável `NODE_VERSION`) | `22` |

Fica em **fantasyti.pages.dev**.

## Se quiser outro nome

Troque `--project-name` no script `deploy` do `package.json`, ou o Project name no
painel. O endereço acompanha: `<nome>.pages.dev`.
