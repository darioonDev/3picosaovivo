import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-24 text-center sm:px-6">
      <Construction className="h-8 w-8 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      <span className="mt-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
        Em desenvolvimento
      </span>
    </div>
  );
}
