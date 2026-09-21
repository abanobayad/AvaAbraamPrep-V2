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

  const khodam = await getKhodam();

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
