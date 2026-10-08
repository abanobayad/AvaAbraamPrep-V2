export const dynamic = 'force-dynamic';
import { cookies } from "next/headers";
import { verifyToken } from "@/services/auth";
import { handleLogout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Award, PlaySquare } from "lucide-react";
import Link from "next/link";
import { getStudentById, getLeaderboard } from "@/app/actions/db";
import { StudentPortalClient } from "@/components/features/StudentPortalClient";

export default async function StudentPortal() {
  const token = cookies().get("auth_token")?.value;
  const session = token ? await verifyToken(token) : null;
  
  let student = null;
  let allStudents = [];
  try {
    if (session) {
      const resStudent = await getStudentById(session.id); if (resStudent.success) student = resStudent.data;
    }
    const resAll = await getLeaderboard(); if (resAll.success) allStudents = resAll.data;
  } catch (error: any) {
    return (
      <div className="max-w-5xl mx-auto space-y-12 pt-6">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          <p>حدث خطأ في جلب بياناتك.</p>
          <pre className="text-sm mt-2">{error.message}</pre>
        </div>
      </div>
    );
  }
  
  const sortedStudents = [...allStudents].sort((a: any, b: any) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.name.localeCompare(b.name, 'ar');
  });

  return (
    <div className="max-w-5xl mx-auto space-y-12 pt-6">
      <header className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 py-6 border-b border-border">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">بوابة المخدوم</h1>
          <p className="text-muted-foreground mt-2">نظام الحضور والنقاط</p>
        </div>
        <form action={handleLogout}>
          <Button variant="outline" type="submit">
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل خروج
          </Button>
        </form>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between border border-primary/20 shadow-sm relative overflow-hidden">
        {/* Make points clickable in hero as well to open modal if we wanted, but we'll stick to leaderboard */}
        <div className="z-10">
          <h2 className="text-2xl font-bold">أهلاً بك يا {student?.name || session?.username} 👋</h2>
          <p className="text-muted-foreground mt-2">
            آخر تحديث للنقاط: {student?.updatedAt ? new Date(student.updatedAt).toLocaleDateString('ar-EG') : "لم يتم التحديث"}
          </p>
        </div>
        <div className="mt-6 md:mt-0 flex flex-col items-center bg-card p-6 rounded-xl shadow-sm border border-border z-10">
          <Award className="h-10 w-10 text-amber-500 mb-2" />
          <span className="text-sm text-muted-foreground font-medium">مجموع النقاط</span>
          <span className="text-4xl font-black text-primary mt-1">{student?.totalPoints || 0}</span>
          
          <Button asChild className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white rounded-full font-bold shadow-md">
            <Link href="/media">
              <PlaySquare className="h-5 w-5 ml-2" />
              الميديا
            </Link>
          </Button>
        </div>
      </div>

      <StudentPortalClient students={sortedStudents} currentStudentId={session?.id} />
    </div>
  );
}
