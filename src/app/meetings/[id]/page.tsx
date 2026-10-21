export const dynamic = 'force-dynamic';
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/lib/authz";
import { getMeetingWithStudents } from "@/app/actions/meetings";
import { meetingTypeLabel } from "@/config/meetings";
import { Button } from "@/components/ui/button";
import { AttendanceClient } from "@/components/features/AttendanceClient";

export default async function MeetingAttendancePage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role === "student") redirect("/");

  const res = await getMeetingWithStudents(params.id);
  if (!res?.success) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">{res?.error ?? "تعذر تحميل الاجتماع"}</p>
        <Button variant="outline" asChild>
          <Link href="/meetings"><ArrowRight className="h-4 w-4 ml-2" />العودة للاجتماعات</Link>
        </Button>
      </div>
    );
  }

  const { meeting, students, presentIds } = res.data;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{meeting.title}</h1>
          <p className="text-muted-foreground mt-1">
            {meetingTypeLabel(meeting.category)} · <span dir="ltr">{new Date(meeting.date).toLocaleDateString("ar-EG")}</span> · {meeting.studentClass ?? "كل المراحل"} ·
            <span className="font-bold text-success" dir="ltr"> +{meeting.points}</span> نقطة لكل حاضر
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/meetings">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للاجتماعات
          </Link>
        </Button>
      </div>

      <AttendanceClient meetingId={meeting.id} points={meeting.points} students={students} initialPresentIds={presentIds} showClass={!meeting.studentClass} />
    </div>
  );
}
