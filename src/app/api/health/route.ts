import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_VERSION } from "@/lib/version";
import { bootstrapDatabase, getBootstrapStatus } from "@/lib/bootstrap";
import { getSession } from "@/lib/authz";

export const dynamic = "force-dynamic";

/**
 * Liveness, database and migration check for monitoring and deploy verification.
 * Also runs the startup bootstrap if it has not run in this process yet (idempotent).
 * Anonymous callers get a coarse status; a logged-in superadmin also sees which
 * migrations ran and any bootstrap error.
 */
export async function GET() {
  try {
    await bootstrapDatabase();
  } catch {}

  let db: "ok" | "error" = "error";
  let tables = 0;
  try {
    const rows = await prisma.$queryRaw<{ n: bigint | number }[]>`SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE()`;
    tables = Number(rows[0]?.n ?? 0);
    db = "ok";
  } catch {
    db = "error";
  }

  const status = getBootstrapStatus();
  const bootstrap = status.error ? "error" : status.finishedAt ? "ok" : "running";
  const body: Record<string, unknown> = { ok: db === "ok", db, tables, version: APP_VERSION, bootstrap, time: new Date().toISOString() };

  let session = null;
  try {
    session = await getSession();
  } catch {}
  if (session?.role === "superadmin") body.bootstrapDetails = status;

  return NextResponse.json(body, { status: db === "ok" ? 200 : 503, headers: { "cache-control": "no-store" } });
}
