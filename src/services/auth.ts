import { SignJWT, jwtVerify } from "jose";

export type Role = "superadmin" | "admin" | "student";

export interface UserSession {
  id: string;
  username: string;
  role: Role;
}

const secretKey = "super-secret-attendance-key-for-dev";
const encodedKey = new TextEncoder().encode(secretKey);

export async function createToken(payload: UserSession) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}
