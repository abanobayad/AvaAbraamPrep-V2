import { SignJWT, jwtVerify } from "jose";

export type Role = "superadmin" | "admin" | "student";

export interface UserSession {
  type: "student" | "staff";
  id: string;
  username: string;
  role: Role;
}

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
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
