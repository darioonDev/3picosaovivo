import Link from "next/link";
import { SECTIONS, type SectionId } from "@/lib/config/kinds";
import { cn } from "@/lib/utils";

/**
 * Section menu. Server component: the active section comes from ?section=, so
 * it is deep-linkable and a save can re-render with re-resolved values.
 */
export function AdminNav({
  active,
  available,
}: {
  active: SectionId;
  available: readonly SectionId[];
}) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Seções de configuração">
      {SECTIONS.filter((s) => available.includes(s.id)).map((section) => {
        const isActive = section.id === active;
        return (
          <Link
            key={section.id}
            href={`/admin?section=${section.id}`}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col gap-0.5 rounded-md border-l-2 px-3 py-2 transition-colors",
              isActive
                ? "border-primary bg-muted text-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <span className="text-sm font-semibold">{section.label}</span>
            <span className="text-[11px] text-muted-foreground">{section.blurb}</span>
          </Link>
        );
      })}
    </nav>
  );
}
