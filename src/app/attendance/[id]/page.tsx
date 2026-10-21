export const dynamic = 'force-dynamic';
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSession as getAuthSession } from "@/lib/authz";
import { getSession as getAttendanceSession } from "@/app/actions/meetings";
import { formatDateAr } from "@/config/meetings";
import { Button } from "@/components/ui/button";
import { AttendanceClient } from "@/components/features/AttendanceClient";

export default async function AttendanceSheetPage({ params }: { params: { id: string } }) {
  const auth = await getAuthSession();
  if (!auth || auth.role === "student") redirect("/");

  const res = await getAttendanceSession(params.id);
  if (!res?.success) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">{res?.error ?? "تعذر تحميل كشف الحضور"}</p>
        <Button variant="outline" asChild>
          <Link href="/meetings"><ArrowRight className="h-4 w-4 ml-2" />العودة للاجتماعات</Link>
        </Button>
      </div>
    );
  }

  const { session, meeting, students, presentIds } = res.data;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pt-6">
      <Link href={`/meetings/${meeting.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4" />
        {meeting.title}
      </Link>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">الحضور</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold text-primary">{formatDateAr(session.date)}</h1>
      </div>

      <AttendanceClient sessionId={session.id} points={meeting.points} students={students} initialPresentIds={presentIds} showClass={!meeting.studentClass} />
    </div>
  );
}
