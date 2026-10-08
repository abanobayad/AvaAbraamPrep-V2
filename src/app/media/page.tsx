export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation";
import { getSession } from "@/lib/authz";
import { getMedia } from "@/app/actions/db";
import { AppShell } from "@/components/layout/AppShell";
import { MediaClient } from "@/components/features/MediaClient";

export default async function MediaPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const res = await getMedia();
  const mediaList = res?.success ? res.data : [];
  const isStudent = session.role === "student";

  return (
    <AppShell session={session} title="الميديا" back={isStudent ? "/student-portal" : undefined}>
      {res?.success ? null : (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          تعذر تحميل الروابط. حدّث الصفحة.
        </p>
      )}
      <MediaClient initialMedia={mediaList} canAdd={!isStudent} />
    </AppShell>
  );
}
