import { SignJWT, jwtVerify } from "jose";
import { getRequestContext } from "@cloudflare/next-on-pages";

export type Role = "superadmin" | "admin" | "student";

export interface UserSession {
  id: string;
  username: string;
  role: Role;
}

export function getJwtSecret(): Uint8Array {
  let secret = process.env.JWT_SECRET;
  
  if (!secret) {
    try {
      const ctx = getRequestContext();
      if ((ctx?.env as any)?.JWT_SECRET) {
        secret = (ctx.env as any).JWT_SECRET as string;
      }
    } catch (e) {
      // Ignore if called in a context where getRequestContext is invalid
    }
  }

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET environment variable is missing or shorter than 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

export async function createToken(payload: UserSession) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}
