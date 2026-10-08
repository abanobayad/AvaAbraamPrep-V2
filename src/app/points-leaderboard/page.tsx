export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation";
import { getSession } from "@/lib/authz";
import { getLeaderboard } from "@/app/actions/db";
import { AppShell } from "@/components/layout/AppShell";
import { PointsLeaderboardClient } from "@/components/features/PointsLeaderboardClient";

export default async function PointsLeaderboardPage() {
  const session = await getSession();
  if (!session || session.role === "student") redirect("/");

  const res = await getLeaderboard();
  const students = res?.success ? res.data : [];

  return (
    <AppShell session={session} title="النقاط">
      {res?.success ? null : (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          تعذر تحميل القائمة. حدّث الصفحة.
        </p>
      )}
      <PointsLeaderboardClient initialStudents={students} />
    </AppShell>
  );
}
