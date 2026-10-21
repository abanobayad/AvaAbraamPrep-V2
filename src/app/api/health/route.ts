import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_VERSION } from "@/lib/version";
import { bootstrapDatabase, getBootstrapStatus } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

/**
 * Liveness, database and migration check for monitoring and deploy verification.
 * Also runs the startup bootstrap if it has not run in this process yet (idempotent).
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
  return NextResponse.json(
    { ok: db === "ok", db, tables, version: APP_VERSION, bootstrap: getBootstrapStatus(), time: new Date().toISOString() },
    { status: db === "ok" ? 200 : 503, headers: { "cache-control": "no-store" } }
  );
}
