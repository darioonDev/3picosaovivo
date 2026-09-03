import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  live?: boolean;
}

const NAV_LINKS = [
  { href: "/", label: "Ao vivo" },
  { href: "/historico", label: "Histórico" },
  { href: "/picos", label: "Picos" },
  { href: "/timelapse", label: "Timelapse" },
];

export function DashboardHeader({ live = true }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Centro de monitoramento
          </span>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            OLHAR DOS TRÊS PICOS
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoramento visual e meteorológico das montanhas
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Badge
            variant="outline"
            className={
              live
                ? "gap-1.5 border-emerald-500/40 text-emerald-400"
                : "gap-1.5 text-muted-foreground"
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                live ? "animate-pulse bg-emerald-400" : "bg-muted-foreground"
              }`}
            />
            {live ? "AO VIVO" : "OFFLINE"}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            Mascarin • Nova Friburgo • RJ
          </span>
        </div>
      </div>
      <nav className="flex items-center gap-5 font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
