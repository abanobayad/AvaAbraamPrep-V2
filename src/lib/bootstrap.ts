import { createHash, randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

let pending: Promise<void> | null = null;

/**
 * Makes a fresh deployment usable without manual steps:
 * 1. applies pending Prisma migrations by executing the SQL files in
 *    prisma/migrations directly (no CLI, no shell), recording them exactly the
 *    way `prisma migrate deploy` does, so both stay interchangeable;
 * 2. creates the first superadmin from ADMIN_USERNAME / ADMIN_PASSWORD if none exists.
 * Safe to call many times; work happens once per process.
 */
export function bootstrapDatabase(): Promise<void> {
  if (!pending) pending = run();
  return pending;
}

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("bootstrap: DATABASE_URL is not set; the app cannot reach its database.");
    return;
  }
  try {
    await applyMigrations();
  } catch (e) {
    console.error("bootstrap: applying migrations failed", e);
  }
  try {
    await ensureSuperadmin();
  } catch (e) {
    console.error("bootstrap: could not create the first superadmin", e);
  }
}

function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((chunk) => chunk.split(/\r?\n/).filter((line) => !line.trim().startsWith("--")).join("\n").trim())
    .filter((s) => s.length > 0);
}

async function applyMigrations() {
  const dir = path.join(process.cwd(), "prisma", "migrations");
  if (!existsSync(dir)) {
    console.error(`bootstrap: migrations folder not found at ${dir}`);
    return;
  }

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

  const names = readdirSync(dir)
    .filter((n) => existsSync(path.join(dir, n, "migration.sql")))
    .sort();

  for (const name of names) {
    if (applied.has(name)) continue;
    const sql = readFileSync(path.join(dir, name, "migration.sql"), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      "INSERT INTO `_prisma_migrations` (`id`, `checksum`, `migration_name`, `started_at`) VALUES (?, ?, ?, NOW(3))",
      id, checksum, name
    );
    const statements = splitStatements(sql);
    let steps = 0;
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
      steps++;
    }
    await prisma.$executeRawUnsafe(
      "UPDATE `_prisma_migrations` SET `finished_at` = NOW(3), `applied_steps_count` = ? WHERE `id` = ?",
      steps, id
    );
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
