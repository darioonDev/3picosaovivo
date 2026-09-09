import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  live?: boolean;
  siteName: string;
  tagline: string;
  locationLabel: string;
  eyebrow: string;
  logoUrl: string;
  /** Raw "Label|/path" entries from the panel. */
  navItems: string[];
}

/** "Rótulo|/caminho" → a link. A missing path falls back to "/". */
function parseNavItem(entry: string): { label: string; href: string } | null {
  const [label, href] = entry.split("|");
  const trimmed = label?.trim();
  if (!trimmed) return null;
  return { label: trimmed, href: href?.trim() || "/" };
}

export function DashboardHeader({
  live = true,
  siteName,
  tagline,
  locationLabel,
  eyebrow,
  logoUrl,
  navItems,
}: DashboardHeaderProps) {
  const links = navItems.map(parseNavItem).filter((l) => l !== null);

  return (
    <header className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={siteName}
              className="size-10 flex-none object-contain"
            />
          )}
          <div className="flex flex-col gap-1">
            {eyebrow && (
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                {eyebrow}
              </span>
            )}
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {siteName}
            </h1>
            {tagline && <p className="text-sm text-muted-foreground">{tagline}</p>}
          </div>
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
          {locationLabel && (
            <span className="font-mono text-xs text-muted-foreground">
              {locationLabel}
            </span>
          )}
        </div>
      </div>
      {links.length > 0 && (
        <nav className="flex items-center gap-5 font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {links.map((link) => (
            <Link
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
