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
  
  // Explicitly reject student tokens from staff-only role requirements, just as an extra check
  if (!roles.includes("student") && session.type === "student") {
    throw new Error("Forbidden");
  }
  return session;
}
