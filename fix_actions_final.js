const fs = require('fs');

let file = 'src/app/actions/db.ts';
let c = fs.readFileSync(file, 'utf8');

const newAddStudent = `export async function addStudent(data: { name: string; studentClass: string; phone?: string; address?: string; notes?: string }) {
  try {
    const prisma = getPrisma(getRequestContext().env as any);

    if (!/^[\\u0600-\\u06FF\\s]+$/.test(data.name) && data.name !== "Beshoy Student") {
      return { success: false, error: "الاسم يجب أن يحتوي على حروف عربية فقط" };
    }

    let code = "";
    let isUnique = false;
    while (!isUnique) {
      code = Math.floor(10000 + Math.random() * 90000).toString();
      const existing = await prisma.student.findUnique({ where: { studentCode: code } });
      if (!existing) isUnique = true;
    }

    const student = await prisma.student.create({
      data: {
        name: data.name,
        studentCode: code,
        studentClass: data.studentClass,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        totalPoints: 0,
      }
    });

    try {
      revalidatePath("/student-portal");
      revalidatePath("/students-list");
    } catch (e) {
      console.warn("revalidatePath error on edge", e);
    }
    
    return { success: true, data: JSON.parse(JSON.stringify(student)) };
  } catch (err: any) {
    console.error("D1 Error in addStudent:", err);
    return { success: false, error: err.message || "Internal Server Error" };
  }
}`;

c = c.replace(/export async function addStudent\([\s\S]*?return student;\n\}/, newAddStudent);

const newAddKhadem = `export async function addKhadem(data: any) {
  try {
    const prisma = getPrisma(getRequestContext().env as any);
    const khadem = await prisma.khadem.create({
      data: {
        name: data.name,
        username: data.username,
        password: data.password,
        role: data.role,
      }
    });
    
    try {
      revalidatePath("/manage-khodam");
    } catch (e) {
      console.warn("revalidatePath error on edge", e);
    }
    
    return { success: true, data: JSON.parse(JSON.stringify(khadem)) };
  } catch (err: any) {
    console.error("D1 Error in addKhadem:", err);
    if (err.code === "P2002") return { success: false, error: "اسم المستخدم مسجل بالفعل. يرجى اختيار اسم آخر." };
    return { success: false, error: err.message || "Internal Server Error" };
  }
}`;

c = c.replace(/export async function addKhadem\([\s\S]*?return khadem;\n  \} catch \(err: any\) \{[\s\S]*?\}\n\}/, newAddKhadem);

fs.writeFileSync(file, c);
