import { cookies } from "next/headers";
import { verifyToken } from "@/services/auth";
import { handleLogout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, UserPlus, Users, Trophy, Award, PlaySquare, CalendarCheck, HeartHandshake } from "lucide-react";
import { EFTEQAD_ENABLED } from "@/lib/features";
import Link from "next/link";
import { ChangeOwnPasswordDialog } from "@/components/features/ChangeOwnPasswordDialog";

export default async function AdminDashboard() {
  const token = cookies().get("auth_token")?.value;
  const session = token ? await verifyToken(token) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 py-6 border-b border-border">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">نظام حضور إعدادي</h1>
          <p className="text-muted-foreground mt-2">أهلاً بك، {session?.username} (خادم)</p>
        </div>
        <div className="flex gap-2">
          <ChangeOwnPasswordDialog />
          <form action={handleLogout}>
          <Button variant="outline" type="submit">
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل خروج
          </Button>
        </form>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-12 pt-8">
        <Link href="/add-student" className="w-40 h-40 rounded-full flex flex-col items-center justify-center text-white shadow-lg hover:scale-105 transition-transform cursor-pointer bg-primary group">
          <UserPlus className="h-12 w-12 mb-3 group-hover:animate-bounce" />
          <span className="font-bold text-lg text-center leading-tight">إضافة مخدوم</span>
        </Link>
        
        <Link href="/students-list" className="w-40 h-40 rounded-full flex flex-col items-center justify-center text-white shadow-lg hover:scale-105 transition-transform cursor-pointer bg-secondary group">
          <Users className="h-12 w-12 mb-3 group-hover:animate-bounce" />
          <span className="font-bold text-lg text-center leading-tight">كشوفات<br/>المخدومين</span>
        </Link>
        
        <Link href="/points-leaderboard" className="w-40 h-40 rounded-full flex flex-col items-center justify-center text-white shadow-lg hover:scale-105 transition-transform cursor-pointer bg-amber-500 group">
          <Award className="h-12 w-12 mb-3 group-hover:animate-bounce" />
          <span className="font-bold text-lg text-center leading-tight">لوحة الشرف</span>
        </Link>

        <Link href="/media" className="w-40 h-40 rounded-full flex flex-col items-center justify-center text-white shadow-lg hover:scale-105 transition-transform cursor-pointer bg-red-500 group">
          <PlaySquare className="h-12 w-12 mb-3 group-hover:animate-bounce" />
          <span className="font-bold text-lg text-center leading-tight">الميديا</span>
        </Link>

        

        {EFTEQAD_ENABLED && (<Link href="/efteqad" className="w-40 h-40 rounded-full flex flex-col items-center justify-center text-white shadow-lg hover:scale-105 transition-transform cursor-pointer bg-emerald-500 group">
          <HeartHandshake className="h-12 w-12 mb-3 group-hover:animate-bounce" />
          <span className="font-bold text-lg text-center leading-tight">كشف الافتقاد</span>
        </Link>)}
      </div>
    </div>
  );
}
