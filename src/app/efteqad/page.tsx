export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation";
import { getSession } from "@/lib/authz";
import { getEfteqadStudents } from "@/app/actions/db";
import { EFTEQAD_ENABLED } from "@/lib/features";
import { AppShell } from "@/components/layout/AppShell";
import { staffHome } from "@/lib/routes";
import { EfteqadClient } from "@/components/features/EfteqadClient";

export default async function EfteqadPage() {
  if (!EFTEQAD_ENABLED) redirect("/");
  const session = await getSession();
  if (!session || session.role === "student") redirect("/");

  const res = await getEfteqadStudents();
  const students = res?.success ? res.data : [];

  return (
    <AppShell session={session} title="الافتقاد" back={staffHome(session.role)}>
      <p className="mb-4 text-sm text-muted-foreground">المخدومون الذين غابوا مرتين متتاليتين.</p>
      <EfteqadClient students={students} khademName={session.username} />
    </AppShell>
  );
}
