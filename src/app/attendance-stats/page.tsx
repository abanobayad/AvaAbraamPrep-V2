export const dynamic = 'force-dynamic';
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/lib/authz";
import { getAttendanceStats } from "@/app/actions/stats";
import { Button } from "@/components/ui/button";
import { AttendanceStatsClient } from "@/components/features/AttendanceStatsClient";

export default async function AttendanceStatsPage({ searchParams }: { searchParams: { month?: string } }) {
  const session = await getSession();
  if (!session || session.role === "student") redirect("/");
  const backHref = session.role === "superadmin" ? "/superadmin-dashboard" : "/admin-dashboard";

  const res = await getAttendanceStats(searchParams?.month ?? null);
  if (!res?.success) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">{res?.error ?? "تعذر تحميل الإحصائيات"}</p>
        <Button variant="outline" asChild>
          <Link href={backHref}><ArrowRight className="h-4 w-4 ml-2" />العودة للرئيسية</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-6">
      <AttendanceStatsClient stats={res.data} backHref={backHref} />
    </div>
  );
}
