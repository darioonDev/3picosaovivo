# Hardware — o que as integrações futuras vão precisar

Nada neste documento é uma especificação de equipamento — é uma lista do que
precisa ser decidido/levantado antes de cada provider mock virar real.
Nenhuma marca, modelo, URL ou credencial é assumida aqui.

## Câmera PTZ

- IP e porta na rede local (ou VPN/túnel, se a câmera não tiver IP público).
- Suporte a ONVIF (para descoberta/controle padronizado) ou SDK proprietário
  do fabricante para PTZ (pan/tilt/zoom) e presets.
- Credenciais de acesso — ficam só no gateway/mini PC, nunca no navegador
  nem no repositório.
- Confirmação de zoom óptico (a proposta original menciona 30×) e dos
  limites reais de pan/tilt, para os presets mock (`mocks/camera.ts`)
  deixarem de ser posições inventadas.
- Máscaras de privacidade, se o campo de visão puder alcançar residências,
  pessoas ou vias — ver seção LGPD abaixo.

## Vídeo ao vivo

- Um gateway/mini PC com acesso de rede à câmera, rodando FFmpeg para
  converter o stream RTSP em HLS.
- Onde o HLS será servido (CDN, servidor próprio) — define o formato da URL
  que `StreamingProvider.getPlaybackUrl()` vai devolver.
- RTSP **nunca** chega ao navegador — o pipeline inteiro (câmera → gateway →
  FFmpeg → HLS → CDN → navegador) existe justamente para evitar isso.

## Estação meteorológica

- Provider é desenhado para ser independente do fabricante
  (`WeatherStationProvider`) — falta decidir qual estação/API real vai por
  trás dele.
- Confirmar: intervalo de atualização real, quais sensores existem de fato
  (a lista em `mocks/weather.ts` inclui radiação solar como opcional —
  nem toda estação tem esse sensor), e se o acesso é local (rede) ou por
  nuvem do fabricante.
- Chave de API (se houver) fica em variável de ambiente, lida só
  server-side.

## Previsão

- Provider de previsão a escolher (`ForecastProvider`) — precisa de
  coordenadas confirmadas do ponto de observação e, dependendo do provedor,
  chave de API server-side.

## Internet

- O provider de conectividade (Starlink, 4G/5G, fibra, outro) que o local
  realmente vai usar ainda não está definido. O que muda para o dashboard é
  só a fonte do dado de status/latência em `system_status` — nenhum
  protocolo específico foi assumido no código.

## Energia

- Telemetria futura de: tensão, corrente, geração solar, carga de bateria,
  temperatura do sistema, autonomia estimada.
- Depende do controlador de carga/inversor escolhido ter alguma saída
  consultável (serial, Modbus, API própria) — a definir.

## LGPD e privacidade

- A câmera deve priorizar natureza/montanha, evitando apontar
  deliberadamente para residências, áreas privadas, pessoas ou placas com
  informação pessoal.
- Se o campo de visão real alcançar essas áreas, os presets
  (`camera_presets` no schema) devem prever uma flag ou zona de máscara —
  hoje não implementada porque ainda não há câmera real para calibrar
  contra.
