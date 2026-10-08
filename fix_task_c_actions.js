const fs = require('fs');
let c = fs.readFileSync('src/app/actions/auth.ts', 'utf8');

const newAuthFns = `
import { requireRole } from "@/app/actions/db"; // we will need to ensure this is exported or imported properly, but auth.ts doesn't have it.
import { verifyToken } from "@/services/auth";
import { revalidatePath } from "next/cache";

export async function resetKhademPassword(userId: string, newPass: string) {
  try {
    const token = cookies().get("auth_token")?.value;
    if (!token) return { success: false, error: "Unauthorized" };
    const session = await verifyToken(token);
    if (!session || session.role !== "superadmin") return { success: false, error: "Unauthorized" };

    if (!newPass || newPass.length < 8 || newPass.length > 64) {
      return { success: false, error: "كلمة السر يجب أن تكون بين 8 و 64 حرف" };
    }

    const prisma = getPrisma(getRequestContext().env as any);
    const target = await prisma.khadem.findUnique({ where: { id: userId } });
    if (!target) return { success: false, error: "الخادم غير موجود" };
    if (target.role === "superadmin") return { success: false, error: "لا يمكن تغيير كلمة سر الـ Superadmin بهذه الطريقة" };

    const newHash = await hashPassword(newPass);
    await prisma.khadem.update({
      where: { id: userId },
      data: { password: newHash }
    });

    try {
      revalidatePath("/manage-khodam");
    } catch(e) {}

    return { success: true, data: null };
  } catch(e: any) {
    console.error(e);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function changeOwnPassword(currentPass: string, newPass: string) {
  try {
    const token = cookies().get("auth_token")?.value;
    if (!token) return { success: false, error: "Unauthorized" };
    const session = await verifyToken(token);
    if (!session) return { success: false, error: "Unauthorized" };

    if (!newPass || newPass.length < 8 || newPass.length > 64) {
      return { success: false, error: "كلمة السر الجديدة يجب أن تكون بين 8 و 64 حرف" };
    }

    const prisma = getPrisma(getRequestContext().env as any);
    const user = await prisma.khadem.findUnique({ where: { id: session.id } });
    if (!user) return { success: false, error: "المستخدم غير موجود" };

    let match = false;
    if (!user.password.startsWith("pbkdf2$")) {
      match = (user.password === currentPass);
    } else {
      match = await verifyPassword(currentPass, user.password);
    }

    if (!match) return { success: false, error: "كلمة السر الحالية غير صحيحة" };

    const newHash = await hashPassword(newPass);
    await prisma.khadem.update({
      where: { id: session.id },
      data: { password: newHash }
    });

    return { success: true, data: null };
  } catch(e: any) {
    console.error(e);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}
`;

c = c + newAuthFns;
fs.writeFileSync('src/app/actions/auth.ts', c);
