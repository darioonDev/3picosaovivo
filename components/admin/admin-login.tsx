"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldLabel, TextInput } from "./field-primitives";

/**
 * Password gate for /admin. The backend for this (POST /api/admin/login) has
 * existed since the project was scaffolded but had no caller — this is the
 * form that finally reaches it.
 */
export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPassword("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível entrar.");
      }
    } catch {
      setError("Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Área administrativa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="admin-password">Senha</FieldLabel>
              <TextInput
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" disabled={busy || password === ""}>
              {busy ? "Entrando…" : "Entrar"}
            </Button>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
