import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import type { AuthUser } from "../types/auth.types";

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if(!authHeader){
        res.status(401).json({
            success: false,
            message: "Authentication required"
        });

        return;

    }

    if(!authHeader.startsWith("Bearer ")){
        res.status(401).json({
            success: false,
            message: "Invalid authorization format"
        });

        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as AuthUser;

        req.user = decoded;

        console.log("Authentication user:", decoded);

        next();
        
    } catch {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });

        return;
    }
};