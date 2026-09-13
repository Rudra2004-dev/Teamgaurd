import {Request, Response} from "express";
import { db } from "../prisma/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
    const {email, password} = req.body;

    if(!email || !password){
        res.status(400).json({
            success: false,
            message: "Email and Password are required"
        });

        return;
    }


    const user = await db.orm.public.User.where({
        email
    }).first();

    if(!user) {
        res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });

        return;
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.password
    );

    if(!passwordMatches){
        res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });

        return;
    }

    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: "15m"
        }
    );

    res.json({
        success: true,
        message: "Login successful",
        token
    });
    ;
}