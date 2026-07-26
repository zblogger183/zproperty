import type { UserRole } from "@/types";

export function getRoleRedirectPath(role?: UserRole | string | null): string {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/admin";
    case "agent":
    case "developer":
      return "/dashboard";
    default:
      return "/buyer";
  }
}
