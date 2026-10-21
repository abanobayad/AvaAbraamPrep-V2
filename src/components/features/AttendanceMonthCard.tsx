import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAttendanceStats } from "@/app/actions/stats";
import { monthLabel } from "@/config/meetings";

/** Dashboard card: this month's attendance rate with a link to the full statistics. */
export async function AttendanceMonthCard() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const res = await getAttendanceStats(month);
  const totals = res?.success ? res.data.totals : null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          الحضور · {monthLabel(month)}
        </CardTitle>
        <CardDescription>
          {totals ? (
            <>
              <span className="font-bold text-foreground" dir="ltr">{totals.present}</span> حاضر من <span className="font-bold text-foreground" dir="ltr">{totals.marks}</span> تسجيل · {totals.sessions} جلسة
            </>
          ) : (
            "تعذر تحميل الحضور."
          )}
        </CardDescription>
      </CardHeader>
      {totals && (
        <CardContent>
          <p className="text-4xl font-black">{totals.rate}<span className="text-base font-medium text-muted-foreground">%</span></p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${totals.rate}%` }} />
          </div>
          <Link href="/attendance-stats" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">عرض إحصائيات الحضور</Link>
        </CardContent>
      )}
    </Card>
  );
}
