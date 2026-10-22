export const dynamic = 'force-dynamic';
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/lib/authz";
import { getStudents } from "@/app/actions/db";
import { CLASSES } from "@/config/classes";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/features/PrintButton";

const ALL = "الكل";

type Row = { id: string; name: string; studentCode: string | null; studentClass: string };

/** Printable sheet of login-code cards, two columns per A4 page. Staff only. */
export default async function PrintCodesPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session || session.role === "student") redirect("/");

  const selected = sp.class && (CLASSES as readonly string[]).includes(sp.class) ? sp.class : ALL;
  const res = await getStudents(selected);
  const students: Row[] = (res?.success ? res.data : [])
    .slice()
    .sort((a: Row, b: Row) => a.studentClass.localeCompare(b.studentClass, "ar") || a.name.localeCompare(b.name, "ar"));

  const host = (await headers()).get("host") ?? "";
  const loginUrl = host.replace(/^www\./, "");

  return (
    <div className="max-w-5xl mx-auto space-y-6 print:max-w-none print:space-y-0">
      {/* Toolbar: hidden when printing */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">كروت أكواد الدخول</h1>
            <p className="text-muted-foreground mt-1">
              <span dir="ltr">{students.length}</span> كارت · كل صفحة تطبع 10 كروت
            </p>
          </div>
          <div className="flex gap-2">
            <PrintButton />
            <Button variant="outline" asChild>
              <Link href="/students-list">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للكشوفات
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[ALL, ...CLASSES].map((c) => (
            <Button key={c} variant={c === selected ? "default" : "outline"} size="sm" asChild>
              <Link href={c === ALL ? "/print-codes" : `/print-codes?class=${encodeURIComponent(c)}`}>{c}</Link>
            </Button>
          ))}
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-card print:hidden">
          لا يوجد مخدومين في هذا الاختيار
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
          {students.map((s) => (
            <div
              key={s.id}
              className="code-card rounded-lg border border-dashed border-gray-400 bg-white text-black p-4 break-inside-avoid"
            >
              <p className="text-[10px] text-gray-500 leading-tight">
                أسرة مارمينا والبابا كيرلس · بوابة المخدومين · {s.studentClass}
              </p>
              <p className="mt-1 text-lg font-bold leading-snug">{s.name}</p>
              <p className="mt-2 text-[10px] text-gray-500">كود الدخول</p>
              <p className="font-mono text-3xl font-bold tracking-[0.35em] leading-none mt-0.5" dir="ltr">
                {s.studentCode ?? "—"}
              </p>
              <p className="mt-3 text-[10px] text-gray-600">
                ادخل من <span className="font-bold" dir="ltr">{loginUrl}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
