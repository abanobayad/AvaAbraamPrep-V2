export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/authz";
import { AppShell } from "@/components/layout/AppShell";
import { StudentList } from "@/components/features/StudentList";

export default async function StudentsListPage() {
  const session = await getSession();
  return (
    <AppShell session={session} title="المخدومين">
      <StudentList />
    </AppShell>
  );
}
