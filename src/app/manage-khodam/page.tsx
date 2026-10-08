export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation";
import { getSession } from "@/lib/authz";
import { getKhodam } from "@/app/actions/db";
import { AppShell } from "@/components/layout/AppShell";
import { ManageKhodamClient } from "@/components/features/ManageKhodamClient";

export default async function ManageKhodamPage() {
  const session = await getSession();
  if (session?.role !== "superadmin") redirect("/");

  const res = await getKhodam();
  const khodam = res?.success ? res.data : [];

  return (
    <AppShell session={session} title="الخدام">
      {res?.success ? null : (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          تعذر تحميل الخدام. حدّث الصفحة.
        </p>
      )}
      <ManageKhodamClient initialKhodam={khodam} currentUserId={session.id} />
    </AppShell>
  );
}
