import type { Role } from "../types/auth.types.js";
import type { Permission } from "../types/permission.types.js";

export const rolePermissions: Record<Role, Permission[]> = {
    SUPER_ADMIN: [
        "CREATE_USER",
        "DELETE_USER",
        "UPDATE_ROLE",
        "READ_REPORTS",
        "MANAGE_TEAMS"
    ],

    ADMIN: [
        "CREATE_USER",
        "DELETE_USER",
        "UPDATE_ROLE",
        "READ_REPORTS",
        "MANAGE_TEAMS"
    ],

    MANAGER: [
        "READ_REPORTS",
        "MANAGE_TEAMS"
    ],

    EMPLOYEE: [
        "READ_REPORTS"
    ],

    GUEST: []
};