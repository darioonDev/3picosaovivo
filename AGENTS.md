<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repositório gêmeo

Este projeto tem um irmão, `camera-24h`, no diretório ao lado. Os dois
compartilham o mesmo **padrão** de configuração, copiado deliberadamente em vez
de extraído para um pacote: cada repo é publicado com `git archive` + build na
Hostinger, então uma dependência `file:` não sobreviveria ao deploy.

Rode **`npm run check:shared`** ao mexer nessa camada. Ele compara os arquivos
gêmeos e distingue dois grupos:

- **idênticos** — devem bater byte a byte; qualquer diferença falha o comando.
  São `lib/uploads.ts`, `lib/config/schema.test.ts`, as rotas de login, senha,
  upload e `asset/[name]`, e o stub do vitest.
- **paralelos** — divergem por natureza (a lista de campos em `schema.ts`, o
  formato do arquivo de estado em `resolve.ts`, o nome do cookie em
  `admin-auth.ts`). O comando só mostra o tamanho da diferença, para uma
  divergência inesperada saltar aos olhos.

Ao corrigir um bug num arquivo do grupo "idênticos", **porte para o outro repo
no mesmo trabalho**. O que sempre diverge é a camada de UI: CSS Modules aqui,
Tailwind + shadcn no outro — essa não é comparada.
