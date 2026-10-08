"use server"

import { cookies, headers } from "next/headers"
import { createToken } from "@/services/auth"
import { redirect } from "next/navigation"
import { getPrisma } from "@/lib/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { hashPassword, verifyPassword } from "@/lib/password";


const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

// Rate limiting is best effort: if the LoginAttempt table is missing or D1 fails,
// log the problem and let the login proceed instead of taking the whole login down.
async function checkRateLimit(keys: string[]) {
  try {
    const prisma = getPrisma(getRequestContext().env as any);
    for (const key of keys) {
      const attempt = await prisma.loginAttempt.findUnique({ where: { key } });
      if (!attempt) continue;
      if (attempt.lockedUntil && attempt.lockedUntil > new Date()) {
        return { locked: true, error: "محاولات كثيرة، حاول بعد 15 دقيقة" };
      }
      if (Date.now() - attempt.windowStart.getTime() > RATE_LIMIT_WINDOW_MS) {
        await prisma.loginAttempt.update({
          where: { key },
          data: { count: 0, windowStart: new Date(), lockedUntil: null }
        });
      }
    }
  } catch (e) {
    console.error("Rate limit check failed (is the LoginAttempt table migrated?)", e);
  }
  return { locked: false };
}

async function incrementRateLimit(keys: string[], limit: number) {
  try {
    const prisma = getPrisma(getRequestContext().env as any);
    for (const key of keys) {
      const attempt = await prisma.loginAttempt.findUnique({ where: { key } });
      if (attempt) {
        const newCount = attempt.count + 1;
        const lockedUntil = newCount >= limit ? new Date(Date.now() + RATE_LIMIT_WINDOW_MS) : null;
        await prisma.loginAttempt.update({ where: { key }, data: { count: newCount, lockedUntil } });
      } else {
        await prisma.loginAttempt.create({ data: { key, count: 1 } });
      }
    }
  } catch (e) {
    console.error("Rate limit increment failed", e);
  }
}

async function resetRateLimit(keys: string[]) {
  try {
    const prisma = getPrisma(getRequestContext().env as any);
    for (const key of keys) {
      await prisma.loginAttempt.deleteMany({ where: { key } });
    }
  } catch (e) {
    console.error("Rate limit reset failed", e);
  }
}

export async function handleLogin(formData: FormData) {
  const prisma = getPrisma(getRequestContext().env as any);

  const username = formData.get("username") as string
  const password = formData.get("password") as string
  const ip = headers().get("cf-connecting-ip") || headers().get("x-forwarded-for") || "unknown";
  
  const rlKeys = [`staff:ip:${ip}`, `staff:user:${username}`];
  const rlCheck = await checkRateLimit(rlKeys);
  if (rlCheck.locked) return { error: rlCheck.error };

  if (!username || !password) {
    await incrementRateLimit(rlKeys, 5);
    return { error: "بيانات الدخول غير صحيحة" };
  }

  // Use Prisma for auth
  const user = await prisma.khadem.findUnique({
    where: { username }
  })
  
  if (!user) {
    await incrementRateLimit(rlKeys, 5);
    return { error: "بيانات الدخول غير صحيحة" };
  }

  let passwordMatch = false;
  if (!user.password.startsWith("pbkdf2$")) {
    // Legacy plain text check
    if (user.password === password) {
      passwordMatch = true;
      // Seamless migration to hash
      const newHash = await hashPassword(password);
      await prisma.khadem.update({
        where: { id: user.id },
        data: { password: newHash }
      });
    }
  } else {
    // Web Crypto PBKDF2 check
    passwordMatch = await verifyPassword(password, user.password);
  }

  if (!passwordMatch) {
    await incrementRateLimit(rlKeys, 5);
    return { error: "بيانات الدخول غير صحيحة" };
  }

  await resetRateLimit(rlKeys);
  const token = await createToken({
    id: user.id,
    username: user.username,
    role: user.role as any,
    type: "staff",
  })
  
  cookies().set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  if (user.role === "superadmin") {
    redirect("/superadmin-dashboard")
  } else if (user.role === "admin") {
    redirect("/admin-dashboard")
  } else {
    redirect("/student-portal")
  }
}

export async function handleLogout() {
  cookies().delete("auth_token")
  redirect("/")
}

export async function loginStudent(formData: FormData) {
  const prisma = getPrisma(getRequestContext().env as any);

  const code = formData.get('code') as string;
  const ip = headers().get("cf-connecting-ip") || headers().get("x-forwarded-for") || "unknown";
  
  const rlKeys = [`student:ip:${ip}`];
  const rlCheck = await checkRateLimit(rlKeys);
  if (rlCheck.locked) return { error: rlCheck.error };
  if (!code) {
    await incrementRateLimit(rlKeys, 10);
    return { error: "الكود غير صحيح" };
  }

  const student = await prisma.student.findUnique({
    where: { studentCode: code }
  });

  if (!student) {
    await incrementRateLimit(rlKeys, 10);
    return { error: "الكود غير صحيح" };
  }

  await resetRateLimit(rlKeys);
  const token = await createToken({
    id: student.id,
    username: student.name,
    role: "student",
    type: "student",
  });

  cookies().set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  redirect('/student-portal');
}

import { requireRole } from "@/lib/authz";
import { verifyToken } from "@/services/auth";

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
    if (target.role === "student") return { success: false, error: "غير مصرح بتغيير كلمة سر طالب" };

    const newHash = await hashPassword(newPass);
    await prisma.khadem.update({
      where: { id: userId },
      data: { password: newHash }
    });

    

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
