import { Info, Mountain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCameraProvider } from "@/providers";

export default async function PicosPage() {
  const presets = await getCameraProvider().getPresets();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Picos e pontos de observação
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Os pontos que a câmera PTZ acompanha na região dos Três Picos
          (Mascarin, Nova Friburgo/RJ). Cada ponto corresponde a um preset de
          enquadramento da câmera.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {presets.map((preset) => (
          <Card key={preset.id}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mountain className="h-4 w-4 text-muted-foreground" />
                {preset.name}
              </CardTitle>
              {preset.status === "active" && (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                  Em observação
                </Badge>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{preset.description}</p>
              <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3 font-mono text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Aproximação (simulada)</span>
                  <span className="text-foreground">{preset.position.zoom}×</span>
                </div>
                <div className="flex justify-between">
                  <span>Altitude</span>
                  <span>a confirmar</span>
                </div>
                <div className="flex justify-between">
                  <span>Coordenadas</span>
                  <span>a confirmar</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 pt-6 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Altitudes, coordenadas e as posições técnicas da câmera (pan/tilt/zoom)
            ainda não estão definidas — os valores de aproximação são simulados.
            Serão confirmados a partir do levantamento de campo e da instalação
            da câmera real.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
