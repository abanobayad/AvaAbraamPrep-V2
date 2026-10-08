export const dynamic = 'force-dynamic';
import { cookies } from "next/headers";
import { verifyToken } from "@/services/auth";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getKhodam } from "@/app/actions/db";
import { ManageKhodamClient } from "@/components/features/ManageKhodamClient";

export default async function ManageKhodamPage() {
  const token = cookies().get("auth_token")?.value;
  const session = token ? await verifyToken(token) : null;
  
  if (session?.role !== "superadmin") {
    redirect("/");
  }

  let khodam = [];
  try {
    const res = await getKhodam(); if (res.success) khodam = res.data;
  } catch (error: any) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pt-6">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          <p>حدث خطأ في جلب بيانات الخدام. يرجى التأكد من أن الجداول موجودة في قاعدة البيانات.</p>
          <pre className="text-sm mt-2">{error.message}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-primary">إدارة الخدام</h1>
        <Button variant="outline" asChild>
          <Link href="/superadmin-dashboard">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للرئيسية
          </Link>
        </Button>
      </div>
      
      <ManageKhodamClient initialKhodam={khodam} />
    </div>
  );
}
