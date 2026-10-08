import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Liveness and database check for monitoring and deploy verification. No auth, no secrets. */
export async function GET() {
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
    { ok: db === "ok", db, tables, version: process.env.npm_package_version ?? null, time: new Date().toISOString() },
    { status: db === "ok" ? 200 : 503, headers: { "cache-control": "no-store" } }
  );
}
