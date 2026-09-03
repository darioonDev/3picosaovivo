# Planejamento

## O que existe nesta versão (v1)

- Dashboard `/` completo com dados 100% simulados: câmera (mock visual +
  presets), condições atuais, previsão (horária e diária), histórico
  (24h/7d/30d) e status de infraestrutura.
- Navegação para `/historico`, `/picos`, `/timelapse`, `/admin` — todas como
  placeholder "Em desenvolvimento".
- Camada de providers (`providers/`) isolando cada domínio atrás de uma
  interface, com implementação mock.
- Schema conceitual de banco (`db/schema.sql`), não aplicado.
- Testes automatizados dos providers mock e de um componente.

## Próximos passos sugeridos (em ordem razoável)

1. **`/picos`** — página de conteúdo estático com as montanhas/pontos já
   modelados em `mountains` (schema) e nos presets mock; não depende de
   nenhuma integração real, é o próximo item "barato".
2. **`/historico`** — versão dedicada do histórico (períodos maiores, export,
   comparação entre métricas), ainda sobre dados mock ou já sobre
   `weather_readings` se o banco for provisionado antes da estação real.
3. **Provisionar banco** (Supabase ou Postgres gerenciado) e aplicar
   `db/schema.sql` — pré-requisito para qualquer dado deixar de ser mock em
   memória.
4. **Estação meteorológica real** — implementar `WeatherStationProvider`
   contra a API do fabricante escolhido; `CurrentWeatherCard`,
   `WeatherHistoryChart` não mudam.
5. **Previsão real** — implementar `ForecastProvider` contra uma API de
   previsão; `ForecastCard`/`ForecastTimeline` não mudam.
6. **Câmera PTZ real** — implementar `CameraProvider` (ONVIF/RTSP via
   gateway); `gotoPreset` passa a mandar comando real, e a chamada
   provavelmente migra de client-side para uma Server Action.
7. **Vídeo ao vivo** — pipeline RTSP → FFmpeg → HLS → CDN (ver
   `docs/ARQUITETURA.md`); `StreamingProvider.getPlaybackUrl()` passa a
   devolver uma URL real e `LiveCameraViewer` ganha um player de verdade.
8. **Timelapse** — geração de sequências a partir dos frames capturados,
   populando `timelapses`.
9. **Alertas** — regras sobre `weather_readings`/`weather_alerts` (vento
   forte, tempestade se aproximando, geada).
10. **Monitoramento de infraestrutura real** — telemetria de internet,
    energia solar/bateria substituindo `mocks/system-status.ts`.
11. **`/admin`** — CRUD de presets, configurações (`settings`) e
    reconhecimento de alertas; precisa de autenticação antes de sair do
    placeholder.

## Fora de escopo por enquanto

Credenciais de produção, protocolos específicos de hardware ainda não
escolhido, URLs de RTSP/Starlink reais — nada disso deve ser inventado antes
de existir de fato. Ver `docs/HARDWARE.md`.
