import { getEfteqadStudents } from "@/app/actions/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/services/auth";
import { redirect } from "next/navigation";
import { EfteqadClient } from "@/components/features/EfteqadClient";

import { EFTEQAD_ENABLED } from "@/lib/features";

export default async function EfteqadPage() {
  if (!EFTEQAD_ENABLED) redirect("/");
  const token = cookies().get("auth_token")?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session || session.role === "student") {
    redirect("/");
  }

  let students = [];
  try {
    const res = await getEfteqadStudents(); if (res.success) students = res.data;
  } catch (error: any) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          <p>حدث خطأ في جلب بيانات الافتقاد.</p>
          <pre className="text-sm mt-2">{error.message}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">كشف الافتقاد</h1>
          <p className="text-muted-foreground">الطلاب الذين غابوا مرتين متتاليتين ويحتاجون لافتقاد</p>
        </div>
      </header>

      <EfteqadClient students={students} khademName={session.username} />
    </div>
  );
}
