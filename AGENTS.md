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

Mantidos estruturalmente idênticos nos dois lados:

- `lib/config/kinds.ts` — tipos dos campos e a lista de seções
- `lib/config/schema.ts` — o registro declarativo (campos diferentes, mesma máquina)
- `lib/config/resolve.ts` — resolução painel → env → padrão, e a gravação atômica
- `lib/admin-auth.ts` — senha em hash scrypt, cookie assinado, versão de sessão
- `lib/uploads.ts` — upload de imagens ao lado do arquivo de estado
- `app/api/admin/*` e `app/api/asset/[name]` — as rotas do painel

Ao mexer em qualquer um deles, **verifique se a mudança cabe no outro repo
também**. O que diverge por natureza: a lista de campos em `schema.ts`, o
formato do arquivo de estado, e toda a camada de UI (CSS Modules aqui,
Tailwind + shadcn no outro).
