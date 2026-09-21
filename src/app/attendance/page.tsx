import { getStudents } from "@/app/actions/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/services/auth";
import { redirect } from "next/navigation";
import { AttendanceClient } from "@/components/features/AttendanceClient";

export default async function AttendancePage() {
  const token = cookies().get("auth_token")?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session || session.role === "student") {
    redirect("/");
  }

  const students = await getStudents();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-indigo-600">تسجيل الحضور</h1>
          <p className="text-muted-foreground">قم بتسجيل حضور وغياب المخدومين ليوم محدد</p>
        </div>
      </header>

      <AttendanceClient students={students} khademName={session.username} />
    </div>
  );
}
