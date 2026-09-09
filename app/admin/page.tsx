import { AdminLogin } from "@/components/admin/admin-login";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { SecurityPanel } from "@/components/admin/security-panel";
import { SectionForm } from "@/components/admin/section-form";
import { Card, CardContent } from "@/components/ui/card";
import {
  hasStoredPassword,
  isAdminEnabled,
  isAuthenticated,
  MIN_PASSWORD_LENGTH,
} from "@/lib/admin-auth";
import { SECTIONS, type SectionId } from "@/lib/config/kinds";
import { getAvailableSections, getSectionFields } from "@/lib/config/resolve";
import { isWritable } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export default async function AdminPage(props: PageProps<"/admin">) {
  if (!(await isAdminEnabled())) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10 sm:px-6">
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6">
            <h1 className="text-base font-semibold">Painel desabilitado</h1>
            <p className="text-sm text-muted-foreground">
              Defina a variável de ambiente <code>ADMIN_PASSWORD</code> no
              servidor para habilitar o painel administrativo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!(await isAuthenticated())) {
    return <AdminLogin />;
  }

  const available = getAvailableSections();
  const { section } = await props.searchParams;
  const active: SectionId =
    typeof section === "string" && available.includes(section as SectionId)
      ? (section as SectionId)
      : available[0];

  const meta = SECTIONS.find((s) => s.id === active)!;
  const fields = await getSectionFields(active);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Olhar dos Três Picos — CEF
          </p>
        </div>
        <LogoutButton />
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="md:border-r md:border-border md:pr-4">
          <AdminNav active={active} available={available} />
        </aside>

        <Card>
          <CardContent className="flex flex-col gap-5 pt-6">
            {/* key remounts the form on section change so its local state
                never carries over from the previous section. */}
            <SectionForm
              key={active}
              section={active}
              title={meta.label}
              blurb={meta.blurb}
              fields={fields}
              canUpload={await isWritable()}
            />
            {active === "security" && (
              <SecurityPanel
                hasStoredPassword={await hasStoredPassword()}
                envFallbackActive={process.env.ADMIN_PASSWORD !== undefined}
                minLength={MIN_PASSWORD_LENGTH}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        As configurações são gravadas em um arquivo no servidor e têm
        precedência sobre as variáveis de ambiente. Não é necessário republicar
        o site após salvar.
      </p>
    </div>
  );
}
