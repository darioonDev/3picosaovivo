# Olhar dos Três Picos

[![Olhar dos Três Picos](https://img.shields.io/badge/repo-3picosaovivo-181717?logo=github)](https://github.com/darioonDev/3picosaovivo)

Plataforma de monitoramento visual e meteorológico da região dos Três Picos
(Mascarin, Nova Friburgo/RJ).

O que já é **real**: a câmera ao vivo (HLS, via o gateway RTSP→HLS no VPS) e a
estação meteorológica (PWS `INOVAF30` no Weather Underground). Ainda é
**simulado**: previsão do tempo, status de infraestrutura e a galeria de
timelapse. Tudo passa por uma camada de providers, então trocar um mock por
uma integração real não mexe na interface.

Quase toda a configuração é editável em `/admin` — marca, textos, SEO, câmera,
estação, presets — gravando num arquivo no servidor, sem redeploy.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Recharts](https://recharts.org) (via `components/ui/chart`) para os gráficos
- [next-themes](https://github.com/pacocoursey/next-themes) (tema escuro por padrão)
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) para testes

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Script              | O que faz                          |
| -------------------- | ----------------------------------- |
| `npm run dev`         | Servidor de desenvolvimento         |
| `npm run build`       | Build de produção                   |
| `npm run start`       | Sobe o build de produção            |
| `npm run lint`        | ESLint                              |
| `npm run typecheck`   | `tsc --noEmit`                      |
| `npm run test`        | Testes (Vitest)                     |

## Estrutura

```
app/                  rotas (App Router)
  page.tsx             dashboard "/"
  historico/           placeholder
  picos/               placeholder
  timelapse/           placeholder
  admin/               placeholder
components/
  dashboard/           componentes do dashboard
  ui/                  shadcn/ui
providers/             interfaces + implementações mock por domínio
mocks/                 dados simulados centralizados
db/schema.sql          schema conceitual (Postgres/Supabase, não aplicado)
docs/                  arquitetura, planejamento, hardware
```

Veja `docs/ARQUITETURA.md` para como a camada de providers funciona e
`docs/PLANEJAMENTO.md` para o que vem depois desta primeira versão.

## O que ainda é simulado

Previsão do tempo, status de infraestrutura e timelapse vêm de geradores
determinísticos em `mocks/`. Os presets de câmera são reais como dados (ficam
no store e são editáveis no `/admin`), mas o "movimento" é simulado — não há
PTZ conectada. Veja `docs/HARDWARE.md` para o que cada integração futura vai
precisar antes de deixar de ser mock.

## Painel administrativo

`/admin` pede a senha de `ADMIN_PASSWORD` (ou a senha definida no próprio
painel) e mostra as seções Câmera, Estação, Identidade e Segurança. As
configurações vão para o arquivo apontado por `STORE_PATH` e **têm precedência
sobre as variáveis de ambiente**; limpar um campo faz a variável valer de novo.

A senha pode ser trocada pelo painel — fica gravada como hash scrypt, e
`ADMIN_PASSWORD` continua valendo como acesso de emergência. Esqueceu a senha
nova? Remova a chave `_auth` do arquivo de estado.

Veja `.env.example` para todas as variáveis.
