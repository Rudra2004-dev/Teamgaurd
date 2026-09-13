import type {Request, Response, NextFunction } from "express";
import type { Role } from "../types/auth.types.js";

export const requireRole = (...allowedRoles: Role[]) => {
    return(req: Request, res: Response, next: NextFunction) => {
        if(!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required"
            });
            
            return;

        }

        if(!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: "Access denied"
            });
            return;
        }
        next();
    };
};