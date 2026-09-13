import { Request, Response, NextFunction } from "express"; 
import type {Permission} from "../types/permission.types.js";
import { rolePermissions } from "../config/role-permission";


export const requirePermission = (...requiredPermissions: Permission[]) => {
    return (req: Request, res: Response, next: NextFunction) => {

        if(!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required"
            });

            return;

        }

        console.log("User role:", req.user.role);

        const userPermissions = rolePermissions[req.user.role];

        const hasPermission = requiredPermissions.every(
            permission => userPermissions.includes(permission)
        );

        if(!hasPermission) {
            res.status(403).json({
                success: false,
                message: "Permission denied"
            });

            return;

        }

        next();

    };
};