import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSystemStatus, type SystemComponentStatus } from "@/mocks/system-status";

const STATUS_STYLES: Record<SystemComponentStatus, string> = {
  online: "border-emerald-500/40 text-emerald-400",
  normal: "border-emerald-500/40 text-emerald-400",
  offline: "border-red-500/40 text-red-400",
  low: "border-amber-500/40 text-amber-400",
};

const STATUS_LABELS: Record<SystemComponentStatus, string> = {
  online: "Online",
  normal: "Normal",
  offline: "Offline",
  low: "Baixo",
};

export function SystemStatusPanel() {
  const snapshot = getSystemStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status do sistema</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {snapshot.components.map((component) => (
          <div
            key={component.id}
            className="flex flex-col gap-1.5 rounded-lg border border-border/60 p-3"
          >
            <span className="text-xs text-muted-foreground">{component.label}</span>
            <Badge variant="outline" className={STATUS_STYLES[component.status]}>
              {component.detail ?? STATUS_LABELS[component.status]}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
