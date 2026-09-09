import { TriangleAlert, Info, OctagonAlert } from "lucide-react";
import type { AlertSeverity, WeatherAlert } from "@/lib/store";

/**
 * Unacknowledged weather alerts, shown to everyone on the dashboard.
 *
 * Alerts existed only inside the admin panel: the team could publish one and
 * nobody visiting the site would ever see it. Acknowledging an alert hides it
 * from here without deleting it — the history stays in /admin.
 */
const STYLE: Record<AlertSeverity, string> = {
  info: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  critical: "border-red-500/50 bg-red-500/10 text-red-200",
};

const ICON: Record<AlertSeverity, typeof Info> = {
  info: Info,
  warning: TriangleAlert,
  critical: OctagonAlert,
};

const LABEL: Record<AlertSeverity, string> = {
  info: "Aviso",
  warning: "Atenção",
  critical: "Alerta crítico",
};

// Most severe first, so a critical alert never sits below an informational one.
const ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

export function AlertsBanner({ alerts }: { alerts: WeatherAlert[] }) {
  const active = alerts
    .filter((a) => !a.acknowledged)
    .sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);

  if (active.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" role="status" aria-live="polite">
      {active.map((alert) => {
        const Icon = ICON[alert.severity];
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${STYLE[alert.severity]}`}
          >
            <Icon className="mt-0.5 size-4 flex-none" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                <span className="font-mono text-[11px] uppercase tracking-wide opacity-80">
                  {LABEL[alert.severity]}
                </span>
                <span className="mx-2 opacity-40">·</span>
                {alert.title}
              </p>
              {alert.description && (
                <p className="mt-0.5 text-xs opacity-90">{alert.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
