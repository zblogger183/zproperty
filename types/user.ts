export type UserRole = "super_admin" | "admin" | "agent" | "developer" | "buyer";

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  cnicVerified: boolean;
  createdAt: string;
}
