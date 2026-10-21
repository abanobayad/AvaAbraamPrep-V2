export const dynamic = 'force-dynamic';
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/lib/authz";
import { getMeetings } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { MeetingsClient } from "@/components/features/MeetingsClient";

export default async function MeetingsPage() {
  const session = await getSession();
  if (!session || session.role === "student") redirect("/");

  const res = await getMeetings();
  const meetings = res?.success ? res.data : [];
  const backHref = session.role === "superadmin" ? "/superadmin-dashboard" : "/admin-dashboard";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">الاجتماعات والحضور</h1>
          <p className="text-muted-foreground mt-1">سجّل الحضور وتُضاف النقاط تلقائيًا لكل حاضر</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={backHref}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للرئيسية
          </Link>
        </Button>
      </div>

      {res?.success ? null : (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          تعذر تحميل الاجتماعات. حدّث الصفحة.
        </p>
      )}

      <MeetingsClient initialMeetings={meetings} />
    </div>
  );
}
