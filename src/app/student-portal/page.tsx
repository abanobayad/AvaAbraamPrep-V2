export const dynamic = 'force-dynamic';
import { LogOut } from "lucide-react";
import { getSession } from "@/lib/authz";
import { handleLogout } from "@/app/actions/auth";
import { getStudentById, getLeaderboard } from "@/app/actions/db";
import { AppShell } from "@/components/layout/AppShell";
import { StudentPortalClient } from "@/components/features/StudentPortalClient";

export default async function StudentPortal() {
  const session = await getSession();

  const [resStudent, resAll] = await Promise.all([
    session ? getStudentById(session.id) : Promise.resolve(null),
    getLeaderboard(),
  ]);
  const student = resStudent?.success ? resStudent.data : null;
  const students = resAll?.success ? resAll.data : [];

  const logout = (
    <form action={handleLogout}>
      <button
        type="submit"
        aria-label="تسجيل الخروج"
        title="تسجيل الخروج"
        className="tap flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </form>
  );

  return (
    <AppShell session={session} title="نقاطي" actions={logout} width="narrow">
      <StudentPortalClient
        me={student ? { id: student.id, name: student.name, totalPoints: student.totalPoints, updatedAt: student.updatedAt } : null}
        fallbackName={session?.username ?? ""}
        students={students}
      />
    </AppShell>
  );
}
