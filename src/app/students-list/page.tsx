import { ExportDataCard } from "@/components/features/ExportDataCard";
import { StudentList } from "@/components/features/StudentList";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/services/auth";

export default async function StudentsListPage() {
  const token = cookies().get("auth_token")?.value;
  const session = token ? await verifyToken(token) : null;
  const role = session?.role || "student";
  const canManage = role === "superadmin" || role === "admin";
  const backHref = role === "superadmin" ? "/superadmin-dashboard" : "/admin-dashboard";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-primary">كشوفات المخدومين</h1>
        <Button variant="outline" asChild>
          <Link href={backHref}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للرئيسية
          </Link>
        </Button>
      </div>
      
      {canManage && (
        <div className="w-full md:w-1/2">
          <ExportDataCard />
        </div>
      )}
      
      <StudentList role={role} />
    </div>
  );
}
