export const dynamic = 'force-dynamic';
import { cookies } from "next/headers";
import { verifyToken } from "@/services/auth";
import { redirect } from "next/navigation";
import { ArrowRight, PlaySquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMedia } from "@/app/actions/db";
import { MediaClient } from "@/components/features/MediaClient";

export default async function MediaPage() {
  const token = cookies().get("auth_token")?.value;
  const session = token ? await verifyToken(token) : null;
  
  if (!session) {
    redirect("/");
  }

  let mediaList = [];
  try {
    const res = await getMedia(); if (res.success) mediaList = res.data;
  } catch (error: any) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pt-6">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          <p>حدث خطأ في جلب الميديا.</p>
          <pre className="text-sm mt-2">{error.message}</pre>
        </div>
      </div>
    );
  }
  
  let backHref = "/student-portal";
  if (session.role === "superadmin") backHref = "/superadmin-dashboard";
  else if (session.role === "admin") backHref = "/admin-dashboard";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-6">
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-border pb-4 gap-4">
        <div className="flex items-center gap-3">
          <PlaySquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">الميديا والروابط</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href={backHref}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للرئيسية
          </Link>
        </Button>
      </div>
      
      <MediaClient initialMedia={mediaList} role={session.role} />
    </div>
  );
}
