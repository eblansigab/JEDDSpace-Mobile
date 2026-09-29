import { EmployeeData } from "@/lib/AuthContext";

export function isAdmin(employee: EmployeeData | null | undefined): boolean {
  return employee?.role === "admin";
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}
