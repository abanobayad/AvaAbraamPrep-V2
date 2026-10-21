export const dynamic = 'force-dynamic';
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/lib/authz";
import { getMeeting } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { MeetingShowClient } from "@/components/features/MeetingShowClient";

export default async function MeetingPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role === "student") redirect("/");

  const res = await getMeeting(params.id);
  if (!res?.success) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">{res?.error ?? "تعذر تحميل الاجتماع"}</p>
        <Button variant="outline" asChild>
          <Link href="/meetings"><ArrowRight className="h-4 w-4 ml-2" />العودة للاجتماعات</Link>
        </Button>
      </div>
    );
  }

  const { meeting, sessions, stats, topPresent, topAbsent } = res.data;

  return (
    <div className="max-w-6xl mx-auto pt-6">
      <MeetingShowClient meeting={meeting} sessions={sessions} stats={stats} topPresent={topPresent} topAbsent={topAbsent} />
    </div>
  );
}
