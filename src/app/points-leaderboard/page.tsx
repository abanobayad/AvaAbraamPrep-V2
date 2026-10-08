import { cookies } from "next/headers";
import { verifyToken } from "@/services/auth";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getLeaderboard } from "@/app/actions/db";
import { PointsLeaderboardClient } from "@/components/features/PointsLeaderboardClient";

export default async function PointsLeaderboardPage() {
  const token = cookies().get("auth_token")?.value;
  const session = token ? await verifyToken(token) : null;
  
  if (!session || session.role === "student") {
    redirect("/");
  }

  let students = [];
  try {
    const res = await getLeaderboard(); if (res.success) students = res.data;
  } catch (error: any) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pt-6">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          <p>حدث خطأ في جلب بيانات الطلاب.</p>
          <pre className="text-sm mt-2">{error.message}</pre>
        </div>
      </div>
    );
  }
  
  const backHref = session.role === "superadmin" ? "/superadmin-dashboard" : "/admin-dashboard";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-primary">لوحة الشرف والنقاط</h1>
        <Button variant="outline" asChild>
          <Link href={backHref}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للرئيسية
          </Link>
        </Button>
      </div>
      
      <PointsLeaderboardClient initialStudents={students} currentUser={session.username} />
    </div>
  );
}
