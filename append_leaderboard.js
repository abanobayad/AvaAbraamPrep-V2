const fs = require('fs');
let content = fs.readFileSync('src/app/actions/db.ts', 'utf8');
content += `
export async function getLeaderboard() {
  try {
    await requireRole("superadmin", "admin", "student");
    const prisma = getPrisma(getRequestContext().env as any);
    const result = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        totalPoints: true,
        studentClass: true
      },
      orderBy: { totalPoints: 'desc' }
    });
    return JSON.parse(JSON.stringify(result));
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: err.message };
  }
}
`;
fs.writeFileSync('src/app/actions/db.ts', content);
