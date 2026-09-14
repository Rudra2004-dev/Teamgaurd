import {Request, Response} from "express";
import { db } from "../prisma/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateRefreshToken, hashRefreshToken } from "../utils/token.utils";
import { Temporal } from "temporal-polyfill";

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

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    const expiresAt = Temporal.Now.instant().add({
        seconds: 7 * 24 * 60 * 60
    });

    const session = await db.orm.public.Session.create({
        userId: user.id,
        refreshTokenHash,
        expiresAt,
        userAgent: req.get("user-agent"),
        ipAddress: req.ip,
    });

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
        token,
        refreshToken,
        sessionId: session.id
    });
    
};


export const refresh = async (req: Request, res: Response) => {
    const {refreshToken, sessionId} = req.body;

    if(!refreshToken || !sessionId){
        res.status(400).json({
            success: false,
            message: "Refresh token and session ID required"
        });

        return;

    }

    const session = await db.orm.public.Session.where({
        id: Number(sessionId)
    }).first();

    if(!session){
        res.status(401).json({
            success: false,
            message: "Invalid session"
        });

        return;

    }

    if(session.revokedAt) {
        res.status(401).json({
            success: false,
            message: "Session has been revoked"
        });

        return;

    }

    if(Temporal.Instant.compare(
        Temporal.Now.instant(), 
        session.expiresAt) >= 0) {
        res.status(401).json({
            success: false,
            message: "Session has expired"
        });

        return;

    }

    const tokenMatches = await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash
    );

    if(!tokenMatches){
        res.status(401).json({
            success: false,
            message: "Invalid refresh token"
        });

        return;

    }

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);

    await db.orm.public.Session
    .where({
        id: session.id
    })
    .update({
        refreshTokenHash: newRefreshTokenHash
    });
        

    const token = jwt.sign(
        {
            userId: session.userId,
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: "15m"
        }
    );

    res.json({
        success: true,
        message: "Token refreshed successfully",
        token,
        refreshToken: newRefreshToken,
        sessionId: session.id
    });
};


export const logout = async (req: Request, res: Response) => {
    const {sessionId} = req.body;

    if(!sessionId){
        res.status(400).json({
            success: false,
            message: "Session Id is required"
        });

        return;

    }

    const session = await db.orm.public.Session
          .where({
            id: Number(sessionId)
          })
          .first();

          if(!session){
            res.status(404).json({
                success: false,
                message: "Session not found"
            });

            return;

          }

          await db.orm.public.Session
              .where({
                id:session.id
              })
              .update({
                revokedAt: Temporal.Now.instant()
              });

              res.json({
                success: true,
                message: "Logout successful"
              });
              
};
