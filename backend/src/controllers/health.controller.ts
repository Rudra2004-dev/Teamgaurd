import {Request, Response} from "express";

export const healthCheck = (req: Request, res:Response) => {
    res.json({
        success: true,
        message: "TeamGuard API is running"
    });
};