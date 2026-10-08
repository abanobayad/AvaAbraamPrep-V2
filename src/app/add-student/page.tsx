export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation";
import { getSession } from "@/lib/authz";
import { AppShell } from "@/components/layout/AppShell";
import { staffHome } from "@/lib/routes";
import { AddStudentForm } from "@/components/features/AddStudentForm";

export default async function AddStudentPage() {
  const session = await getSession();
  if (session?.role === "student") redirect("/student-portal");

  return (
    <AppShell session={session} title="إضافة مخدوم" back={staffHome(session?.role)} width="narrow">
      <AddStudentForm />
    </AppShell>
  );
}
