# Olhar dos Três Picos

[![Olhar dos Três Picos](https://img.shields.io/badge/repo-3picosaovivo-181717?logo=github)](https://github.com/darioonDev/3picosaovivo)
[![Sentinela dos Três Picos](https://img.shields.io/badge/projeto_irmão-sentinela--tres--picos-181717?logo=github)](https://github.com/darioonDev/sentinela-tres-picos)

Plataforma de monitoramento visual e meteorológico da região dos Três Picos
(Mascarin, Nova Friburgo/RJ). Esta é a **primeira versão**: toda a câmera,
estação meteorológica, previsão e status de infraestrutura são **dados
simulados**, servidos por uma camada de providers pensada para ser trocada
por integrações reais sem reescrever a interface.

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

## Dados simulados

Nada aqui fala com hardware real. Presets de câmera "se movem" com um
delay simulado, leituras meteorológicas e previsão vêm de geradores
determinísticos em `mocks/`, e o status de infraestrutura é fixo. Isso é
proposital — veja `docs/HARDWARE.md` para o que cada integração futura vai
precisar antes de deixar de ser mock.
