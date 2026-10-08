import { execSync } from "node:child_process";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

let pending: Promise<void> | null = null;

/**
 * Makes a fresh deployment usable without manual steps:
 * 1. applies pending Prisma migrations (creates the tables on first run),
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
    execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env, timeout: 120_000 });
  } catch (e) {
    console.error("bootstrap: prisma migrate deploy failed", e);
  }

  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;

  try {
    const existing = await prisma.khadem.count({ where: { role: "superadmin" } });
    if (existing === 0) {
      await prisma.khadem.create({
        data: { name: username, username, password: await hashPassword(password), role: "superadmin" },
      });
      console.log(`bootstrap: created superadmin "${username}".`);
    }
  } catch (e) {
    console.error("bootstrap: could not create the first superadmin", e);
  }
}
