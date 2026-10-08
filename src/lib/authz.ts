import { cookies } from "next/headers";
import { verifyToken, UserSession, Role } from "@/services/auth";

export async function getSession(): Promise<UserSession | null> {
  const token = cookies().get("auth_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function requireRole(...roles: Role[]): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  if (roles.length > 0 && !roles.includes(session.role)) {
    throw new Error("Forbidden");
  }
  return session;
}
