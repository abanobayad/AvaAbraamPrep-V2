import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { MIGRATIONS } from "@/lib/migrations.generated";

export type BootstrapStatus = {
  ran: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  applied: string[];
  skipped: string[];
  error: string | null;
};

const status: BootstrapStatus = { ran: false, startedAt: null, finishedAt: null, applied: [], skipped: [], error: null };
let pending: Promise<void> | null = null;

export function getBootstrapStatus(): BootstrapStatus {
  return { ...status, applied: [...status.applied], skipped: [...status.skipped] };
}

/**
 * Makes a fresh deployment usable without manual steps:
 * 1. applies pending Prisma migrations from the SQL embedded at build time
 *    (src/lib/migrations.generated.ts, written by scripts/bundle-migrations.mjs),
 *    recording them exactly the way `prisma migrate deploy` does, so both stay
 *    interchangeable;
 * 2. creates the first superadmin from ADMIN_USERNAME / ADMIN_PASSWORD if none exists.
 * Safe to call many times; work happens once per process.
 */
export function bootstrapDatabase(): Promise<void> {
  if (!pending) pending = run();
  return pending;
}

async function run() {
  status.ran = true;
  status.startedAt = new Date().toISOString();
  if (!process.env.DATABASE_URL) {
    status.error = "DATABASE_URL is not set";
    console.error("bootstrap: DATABASE_URL is not set; the app cannot reach its database.");
    status.finishedAt = new Date().toISOString();
    return;
  }
  try {
    await applyMigrations();
  } catch (e: any) {
    status.error = `migrations: ${e?.message ?? String(e)}`;
    console.error("bootstrap: applying migrations failed", e);
  }
  try {
    await ensureSuperadmin();
  } catch (e: any) {
    status.error = (status.error ? status.error + "; " : "") + `superadmin: ${e?.message ?? String(e)}`;
    console.error("bootstrap: could not create the first superadmin", e);
  }
  status.finishedAt = new Date().toISOString();
}

function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((chunk) => chunk.split(/\r?\n/).filter((line) => !line.trim().startsWith("--")).join("\n").trim())
    .filter((s) => s.length > 0);
}

async function applyMigrations() {
  // Same table Prisma Migrate uses, so `prisma migrate deploy` sees our work and vice versa.
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS \`_prisma_migrations\` (
    \`id\` VARCHAR(36) NOT NULL,
    \`checksum\` VARCHAR(64) NOT NULL,
    \`finished_at\` DATETIME(3) NULL,
    \`migration_name\` VARCHAR(255) NOT NULL,
    \`logs\` TEXT NULL,
    \`rolled_back_at\` DATETIME(3) NULL,
    \`started_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`applied_steps_count\` INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (\`id\`)
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  const applied = new Set(
    (await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
      "SELECT migration_name FROM `_prisma_migrations` WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL"
    )).map((r) => r.migration_name)
  );

  for (const { name, sql } of MIGRATIONS) {
    if (applied.has(name)) {
      status.skipped.push(name);
      continue;
    }
    const checksum = createHash("sha256").update(sql).digest("hex");
    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      "INSERT INTO `_prisma_migrations` (`id`, `checksum`, `migration_name`, `started_at`) VALUES (?, ?, ?, NOW(3))",
      id, checksum, name
    );
    let steps = 0;
    try {
      for (const statement of splitStatements(sql)) {
        await prisma.$executeRawUnsafe(statement);
        steps++;
      }
    } catch (e: any) {
      // Leave the unfinished row in place (as Prisma does) so the failure stays diagnosable.
      await prisma.$executeRawUnsafe(
        "UPDATE `_prisma_migrations` SET `logs` = ?, `applied_steps_count` = ? WHERE `id` = ?",
        String(e?.message ?? e).slice(0, 60000), steps, id
      ).catch(() => {});
      throw new Error(`${name} failed at statement ${steps + 1}: ${e?.message ?? e}`);
    }
    await prisma.$executeRawUnsafe(
      "UPDATE `_prisma_migrations` SET `finished_at` = NOW(3), `applied_steps_count` = ? WHERE `id` = ?",
      steps, id
    );
    status.applied.push(name);
    console.log(`bootstrap: applied migration ${name} (${steps} statements).`);
  }
}

async function ensureSuperadmin() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;
  const existing = await prisma.khadem.count({ where: { role: "superadmin" } });
  if (existing > 0) return;
  await prisma.khadem.create({
    data: { name: username, username, password: await hashPassword(password), role: "superadmin" },
  });
  console.log(`bootstrap: created superadmin "${username}".`);
}
