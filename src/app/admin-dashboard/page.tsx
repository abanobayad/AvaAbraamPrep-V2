export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/authz";
import { AppShell } from "@/components/layout/AppShell";
import { StaffHome } from "@/components/features/StaffHome";

export default async function AdminDashboard() {
  const session = await getSession();
  return (
    <AppShell session={session} title="نظام نقاط إعدادي">
      <StaffHome session={session} />
    </AppShell>
  );
}
