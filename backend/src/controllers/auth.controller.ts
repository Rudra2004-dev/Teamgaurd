import {Request, Response} from "express";
import { db } from "../prisma/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateRefreshToken, hashRefreshToken, generatePasswordResetToken } from "../utils/token.utils";
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


    const user = await db.orm.public.User
        .where({
            id: session.userId
        })
        .first();

        if(!user) {
            res.status(401).json({
                success: false,
                message: "User not found"
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
    console.log("Logout user:", req.user);
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

          if(session.userId !== req.user!.userId){
            res.status(403).json({
                success: false,
                message: "You cannot logout this session"
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


export const logoutAll = async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    await db.orm.public.Session
        .where({
            userId
        })
        .update({
            revokedAt: Temporal.Now.instant()
        });

        res.json({
            success: true,
            message: "Logged out from all devices"
        });
};


export const getSessions = async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const sessions = await db.orm.public.Session
        .where({
            userId
        })
        .all();

    const safeSessions = sessions.map((session) => {
        const {
            refreshTokenHash,
            ...safeSession
        } = session;

        return safeSession;
    });    

    res.json({
        success: true,
        sessions: safeSessions
    });    
};



export const revokeSession = async (req: Request, res: Response) => {
    const sessionId = Number(req.params.id);

    if(!sessionId) {
        res.status(400).json({
            success: false,
            message: "Valid session ID is required"
        });

        return;
    }

    const session = await db.orm.public.Session
        .where({
            id: sessionId
        })
        .first();

    if(!session) {
        res.status(404).json({
            success: false,
            message: "Session not found"
        });

        return;
    }    

    if(session.userId !== req.user!.userId) {
        res.status(403).json({
            success: false,
            message: "You cannot revoke this session"
        });

        return;
    }

    await db.orm.public.Session
        .where({
            id: session.id
        })
        .update({
             revokedAt: Temporal.Now.instant()
        });

    res.json({
        success: true,
        message: "Session revoked successfully"
    });    
};


export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        res.status(400).json({
            success: false,
            message: "Email is required"
        });
        return;
    }

    const user = await db.orm.public.User
        .where({
            email
        })
        .first();

    if (!user) {
        res.json({
            success: true,
            message: "If an account exists with this email, a reset link has been sent"
        });
        return;
    }

    const resetToken = generatePasswordResetToken();

    const tokenHash = await bcrypt.hash(
        resetToken,
        10
    );

    const expiresAt = Temporal.Now.instant().add({
        seconds: 15 * 60
    });

    await db.orm.public.PasswordResetToken.create({
        userId: user.id,
        tokenHash,
        expiresAt
    });

    console.log("PASSWORD RESET TOKEN:", resetToken);

    res.json({
        success: true,
        message: "If an account exists with this email, a reset link has been sent"
    });
};


export const resetPassword = async (req: Request, res: Response) => {
    const { token, userId, newPassword } = req.body;

    if (!token || !userId || !newPassword) {
        res.status(400).json({
            success: false,
            message: "Token, user ID, and new password are required"
        });
        return;
    }

    const resetToken = await db.orm.public.PasswordResetToken
        .where({
            userId: Number(userId),
            usedAt: null
        })
        .first();

    if (!resetToken) {
        res.status(400).json({
            success: false,
            message: "Invalid or already used reset token"
        });
        return;
    }

    if (
        Temporal.Instant.compare(
            Temporal.Now.instant(),
            resetToken.expiresAt
        ) >= 0
    ) {
        res.status(400).json({
            success: false,
            message: "Reset token has expired"
        });
        return;
    }

    const tokenMatches = await bcrypt.compare(
        token,
        resetToken.tokenHash
    );

    if (!tokenMatches) {
        res.status(400).json({
            success: false,
            message: "Invalid reset token"
        });
        return;
    }

    const hashedPassword = await bcrypt.hash(
        newPassword,
        10
    );

    await db.orm.public.User
        .where({
            id: Number(userId)
        })
        .update({
            password: hashedPassword
        });

    await db.orm.public.PasswordResetToken
        .where({
            id: resetToken.id
        })
        .update({
            usedAt: Temporal.Now.instant()
        });

    await db.orm.public.Session
        .where({
            userId: Number(userId)
        })
        .update({
            revokedAt: Temporal.Now.instant()
        });

    res.json({
        success: true,
        message: "Password reset successful"
    });
};
