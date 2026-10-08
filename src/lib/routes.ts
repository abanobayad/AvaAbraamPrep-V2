import type { Role } from "@/services/auth";

/** Home screen for a staff role. Shared by server and client code. */
export function staffHome(role: Role | null | undefined) {
  return role === "superadmin" ? "/superadmin-dashboard" : "/admin-dashboard";
}
