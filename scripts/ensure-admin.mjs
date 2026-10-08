// Creates the first superadmin from ADMIN_USERNAME / ADMIN_PASSWORD when no
// superadmin exists yet. Runs before `next start` so a fresh deployment has a login.
import { PrismaClient } from "@prisma/client";

const ITERATIONS = 100000;

function toBase64(buffer) {
  return Buffer.from(new Uint8Array(buffer)).toString("base64");
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, keyMaterial, 256);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt.buffer)}$${toBase64(hash)}`;
}

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
if (!username || !password) {
  console.log("ensure-admin: ADMIN_USERNAME / ADMIN_PASSWORD not set, skipping.");
  process.exit(0);
}

const prisma = new PrismaClient();
try {
  const existing = await prisma.khadem.count({ where: { role: "superadmin" } });
  if (existing > 0) {
    console.log("ensure-admin: a superadmin already exists, skipping.");
  } else {
    await prisma.khadem.create({
      data: { name: username, username, password: await hashPassword(password), role: "superadmin" },
    });
    console.log(`ensure-admin: created superadmin "${username}".`);
  }
} finally {
  await prisma.$disconnect();
}
