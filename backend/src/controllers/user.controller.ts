import {Request, Response} from "express";
import {db} from "../prisma/db.js"
import bcrypt from "bcrypt"



export const createUser = async (req: Request, res: Response) =>{
    const {name, email, password} = req.body;

    if(!name || !email || !password) {
        res.status(400).json({
            success: false,
            message: "Name and email and password are required"
        });

        return;
    }

    const existingUser = await db.orm.public.User.where({
        email
    }).first();

    if(existingUser) {
        res.status(409).json({
            success: false,
            message: "Email already exists"
        });

        return;
    }


    const hashedPassword = await bcrypt.hash(password,10);


    const user = await db.orm.public.User.create({
        name,
        email,
        password: hashedPassword,
    });

    const {password: _, ...safeUser} = user;

    res.status(201).json({
        success: true,
        user: safeUser
    });
};

export const getUsers = async (req: Request, res: Response) =>{

    const users = await db.orm.public.User.all();

    const safeUsers = users.map(({password, ...user}) => user);

    res.json({
        success: true,
        users: safeUsers
    });
};

export const getUserById = async (req: Request, res: Response) => {
    const requestedUserId = Number(req.params.id);
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Authorization: Users can view their own profile OR admins can view any profile
    const isOwnProfile = requestedUserId === currentUserId;
    const isAdmin = currentUserRole === "ADMIN" || currentUserRole === "SUPER_ADMIN";

    if (!isOwnProfile && !isAdmin) {
        res.status(403).json({
            success: false,
            message: "Access denied"
        });

        return;
    }

    // Fetch user from database (only if authorized)
    const user = await db.orm.public.User.where({
        id: requestedUserId
    }).first();

    if(!user) {
        res.status(404).json({
            success: false,
            message: "User not found"
        });

        return;
    }

    const {password, ...safeUser} = user;

    res.json({
        success: true,
        user: safeUser
    });
};