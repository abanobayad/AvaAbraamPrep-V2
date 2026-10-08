"use server"

import { cookies } from "next/headers"
import { createToken } from "@/services/auth"
import { redirect } from "next/navigation"
import { getPrisma } from "@/lib/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function handleLogin(formData: FormData) {
  const prisma = getPrisma(getRequestContext().env as any);

  const username = formData.get("username") as string
  const password = formData.get("password") as string

  if (!username || !password) {
    return { error: "الرجاء إدخال اسم المستخدم وكلمة المرور" }
  }

  // Use Prisma for auth
  const user = await prisma.khadem.findUnique({
    where: { username }
  })
  
  if (!user) {
    return { error: "بيانات الدخول غير صحيحة" }
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
    return { error: "بيانات الدخول غير صحيحة" }
  }

  const token = await createToken({
    id: user.id,
    username: user.username,
    role: user.role as any,
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
  if (!code) return { error: 'الرجاء إدخال الكود' };

  const student = await prisma.student.findUnique({
    where: { studentCode: code }
  });

  if (!student) return { error: 'كود غير صحيح' };

  const token = await createToken({
    id: student.id,
    username: student.name,
    role: 'student',
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
