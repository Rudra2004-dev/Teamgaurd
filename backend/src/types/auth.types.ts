export type Role = 
    | "SUPER_ADMIN"
    | "ADMIN"
    | "MANAGER"
    | "EMPLOYEE"
    | "GUEST";

export interface AuthUser {
    userId: number;
    role: Role;
}