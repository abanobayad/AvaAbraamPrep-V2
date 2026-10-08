export const dynamic = 'force-dynamic';
import { AddStudentForm } from "@/components/features/AddStudentForm";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/services/auth";
import { redirect } from "next/navigation";

export default async function AddStudentPage() {
  const token = cookies().get("auth_token")?.value;
  const session = token ? await verifyToken(token) : null;
  
  if (session?.role === "student") {
    redirect("/student-portal");
  }

  const backHref = session?.role === "superadmin" ? "/superadmin-dashboard" : "/admin-dashboard";

  return (
    <div className="max-w-3xl mx-auto space-y-8 pt-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-primary">إضافة مخدوم جديد</h1>
        <Button variant="outline" asChild>
          <Link href={backHref}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للرئيسية
          </Link>
        </Button>
      </div>
      
      <AddStudentForm />
    </div>
  );
}
