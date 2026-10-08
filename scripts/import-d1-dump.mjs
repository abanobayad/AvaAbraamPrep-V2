// Imports a Cloudflare D1 SQL dump (from `wrangler d1 export attendance-db --remote --output=d1-dump.sql`)
// into the MySQL database configured in DATABASE_URL. Existing rows with the same id are updated.
//
//   node scripts/import-d1-dump.mjs path/to/d1-dump.sql
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/import-d1-dump.mjs <d1-dump.sql>");
  process.exit(1);
}

// Column order of the original D1 tables (used when an INSERT has no column list).
const COLUMNS = {
  Khadem: ["id", "name", "username", "password", "role", "createdAt"],
  Student: ["id", "name", "studentCode", "studentClass", "phone", "address", "notes", "totalPoints", "needsEfteqad", "createdAt", "updatedAt"],
  Transaction: ["id", "studentId", "actionName", "pointsChanged", "addedBy", "timestamp"],
  Media: ["id", "title", "url", "type", "createdAt"],
  Attendance: ["id", "studentId", "date", "status", "recordedBy", "createdAt"],
  EfteqadLog: ["id", "studentId", "date", "khademName", "notes"],
};
const ORDER = ["Khadem", "Student", "Transaction", "Media", "Attendance", "EfteqadLog"];

/** Parses `INSERT INTO "Table" (cols) VALUES (...)` statements, one row each, tolerant of quoting styles. */
function* parseInserts(sql) {
  const re = /INSERT\s+INTO\s+["`]?(\w+)["`]?\s*(\(([^)]*)\))?\s*VALUES\s*\(/gi;
  let m;
  while ((m = re.exec(sql))) {
    const table = m[1];
    const cols = m[3] ? m[3].split(",").map((c) => c.trim().replace(/^["`]|["`]$/g, "")) : null;
    let i = re.lastIndex;
    const values = [];
    let cur = "";
    let inStr = false;
    for (; i < sql.length; i++) {
      const ch = sql[i];
      if (inStr) {
        if (ch === "'") {
          if (sql[i + 1] === "'") { cur += "'"; i++; } else { inStr = false; values.push({ s: cur }); cur = ""; }
        } else cur += ch;
      } else if (ch === "'") {
        inStr = true;
      } else if (ch === "," ) {
        if (cur.trim()) values.push({ raw: cur.trim() });
        cur = "";
      } else if (ch === ")") {
        if (cur.trim()) values.push({ raw: cur.trim() });
        break;
      } else cur += ch;
    }
    re.lastIndex = i + 1;
    const row = values.map((v) => ("s" in v ? v.s : v.raw.toUpperCase() === "NULL" ? null : Number(v.raw)));
    yield { table, cols, row };
  }
}

function toDate(v) {
  if (v === null || v === undefined || v === "") return undefined;
  const d = new Date(typeof v === "string" && !v.includes("T") ? v.replace(" ", "T") + "Z" : v);
  return isNaN(d.getTime()) ? undefined : d;
}
const bool = (v) => v === 1 || v === "1" || v === true;
const str = (v) => (v === null || v === undefined ? null : String(v));
// Old colloquial class spellings -> the formal spelling the app uses.
const CLASS_MAP = { "تانية إعدادي": "ثانية إعدادي", "تالتة إعدادي": "ثالثة إعدادي" };
const normalizeClass = (v) => (v && CLASS_MAP[v]) || v;

const sql = readFileSync(file, "utf8");
const byTable = Object.fromEntries(ORDER.map((t) => [t, []]));
let skipped = 0;
for (const { table, cols, row } of parseInserts(sql)) {
  if (!COLUMNS[table]) { skipped++; continue; }
  const names = cols ?? COLUMNS[table];
  const obj = {};
  names.forEach((n, i) => (obj[n] = row[i]));
  byTable[table].push(obj);
}

const prisma = new PrismaClient();
try {
  for (const t of ORDER) {
    let n = 0;
    for (const r of byTable[t]) {
      if (t === "Khadem") {
        await prisma.khadem.upsert({ where: { id: r.id }, create: { id: r.id, name: str(r.name), username: str(r.username), password: str(r.password), role: str(r.role), createdAt: toDate(r.createdAt) }, update: { name: str(r.name), username: str(r.username), password: str(r.password), role: str(r.role) } });
      } else if (t === "Student") {
        const data = { name: str(r.name), studentCode: str(r.studentCode), studentClass: normalizeClass(str(r.studentClass)), phone: str(r.phone), address: str(r.address), notes: str(r.notes), totalPoints: Number(r.totalPoints) || 0, needsEfteqad: bool(r.needsEfteqad) };
        await prisma.student.upsert({ where: { id: r.id }, create: { id: r.id, ...data, createdAt: toDate(r.createdAt) }, update: data });
      } else if (t === "Transaction") {
        await prisma.transaction.upsert({ where: { id: r.id }, create: { id: r.id, studentId: r.studentId, actionName: str(r.actionName), pointsChanged: Number(r.pointsChanged) || 0, addedBy: str(r.addedBy), timestamp: toDate(r.timestamp) }, update: {} });
      } else if (t === "Media") {
        await prisma.media.upsert({ where: { id: r.id }, create: { id: r.id, title: str(r.title), url: str(r.url), type: str(r.type), createdAt: toDate(r.createdAt) }, update: {} });
      } else if (t === "Attendance") {
        await prisma.attendance.upsert({ where: { id: r.id }, create: { id: r.id, studentId: r.studentId, date: toDate(r.date) ?? new Date(), status: bool(r.status), recordedBy: str(r.recordedBy), createdAt: toDate(r.createdAt) }, update: {} });
      } else if (t === "EfteqadLog") {
        await prisma.efteqadLog.upsert({ where: { id: r.id }, create: { id: r.id, studentId: r.studentId, date: toDate(r.date), khademName: str(r.khademName), notes: str(r.notes) }, update: {} });
      }
      n++;
    }
    console.log(`${t}: ${n} rows`);
  }
  if (skipped) console.log(`skipped ${skipped} rows from other tables`);
} finally {
  await prisma.$disconnect();
}
