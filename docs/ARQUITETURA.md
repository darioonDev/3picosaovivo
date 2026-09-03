# Arquitetura

## Visão geral

O dashboard é um app Next.js (App Router) inteiramente server-rendered por
padrão: cada página busca dados dos providers no servidor e só sobe para o
cliente os componentes que realmente precisam de interatividade (seletor de
presets, abas do histórico). Não há backend próprio ainda — os "providers"
são a camada que vai abstrair isso quando existir.

## Camada de providers

Cada domínio (câmera, estação meteorológica, previsão, streaming) tem:

- uma **interface** TypeScript em `providers/<domínio>/<domínio>-provider.ts`
- uma **implementação mock** em `providers/<domínio>/mock-<domínio>-provider.ts`
- um ponto único de montagem em `providers/index.ts` (`getCameraProvider()`,
  `getWeatherProvider()`, `getForecastProvider()`, `getStreamingProvider()`)

Componentes e páginas só conhecem as interfaces — nunca importam uma
implementação mock diretamente (exceto o próprio `providers/index.ts`, que é
o único lugar que decide qual implementação usar). Trocar mock por real é
questão de:

1. Criar `providers/<domínio>/<algo>-provider.ts` implementando a mesma interface.
2. Trocar o retorno da função correspondente em `providers/index.ts`.

Nenhum componente muda.

Status de infraestrutura (`SystemStatusPanel`) é a única exceção — não foi
pedida uma interface formal para ele, então o componente lê
`mocks/system-status.ts` diretamente. Documentado aqui para não parecer
inconsistência.

## Dados mock

Tudo em `mocks/*.ts` é gerado por um PRNG determinístico
(`mocks/random.ts`, mulberry32) em vez de `Math.random()` — os mesmos
parâmetros sempre produzem a mesma série, então o histórico e a previsão não
"pulam" a cada build ou teste.

## Estado da câmera

`LiveCameraViewer` (mostra o preset ativo) e `CameraPresetSelector` (lista
de botões) são componentes irmãos, então o estado de qual preset está ativo
não pode viver em nenhum dos dois isoladamente — ele mora em
`components/dashboard/camera-section.tsx`, o componente cliente que os
envolve. `gotoPreset()` roda direto no navegador (é tudo mock, sem
credencial ou chamada real envolvida); quando existir uma câmera real por
trás do `CameraProvider`, esse ponto provavelmente precisa migrar para uma
Server Action ou rota de API, para não expor a chamada de controle da PTZ ao
cliente.

## Fluxo futuro do vídeo

A câmera real nunca deve expor RTSP ao navegador. O caminho planejado:

```
Câmera PTZ
     ↓ RTSP
Gateway / Mini PC
     ↓
FFmpeg
     ↓
HLS
     ↓
Servidor/CDN
     ↓
Navegador
```

`StreamingProvider.getPlaybackUrl()` é o ponto de entrada para isso — hoje
sempre retorna `null` porque não existe pipeline HLS real. Quando existir,
essa função passa a devolver a URL do manifesto HLS, e `LiveCameraViewer`
troca o placeholder por um player de vídeo de verdade.

## Banco de dados

`db/schema.sql` descreve o modelo conceitual (Postgres/Supabase) para os 9
domínios pedidos, mas **não está aplicado a nenhum projeto** — não há
Supabase provisionado nesta fase, e nada no app lê de um banco. É o alvo
para quando os providers pararem de ser mock.

## Segurança

Nenhuma credencial (chave de API, senha, URL RTSP privada) existe no
frontend nesta fase porque não existe integração real ainda. Quando
existir: chaves e URLs privadas ficam em variáveis de ambiente lidas só em
código server-side (route handlers, Server Actions) — nunca em um
Client Component, nunca em `NEXT_PUBLIC_*`.

## Decisões técnicas

| Decisão | Por quê |
| --- | --- |
| Next.js App Router | Server Components por padrão reduzem o que precisa ir pro cliente; providers rodam naturalmente no servidor. |
| Tailwind + shadcn/ui | Consistência visual rápida sem escrever um design system do zero; componentes ficam no repo (não é uma dependência de terceiros opaca). |
| Recharts (via shadcn `chart`) | Já integrado ao tema shadcn/ui (cores claro/escuro automáticas), evita mais uma dependência de gráficos concorrente. |
| PRNG determinístico nos mocks | Histórico/previsão estáveis entre reloads, builds e testes. |
| Sem Supabase provisionado ainda | O pedido original é explícito em não implementar integração real nesta fase; o schema fica pronto como código. |
