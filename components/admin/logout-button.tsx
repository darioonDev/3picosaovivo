"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
        router.refresh();
      }}
    >
      Sair
    </Button>
  );
}
