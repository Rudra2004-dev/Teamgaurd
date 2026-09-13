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
    const id = Number(req.params.id);


    const user = await db.orm.public.User.where({
        id
    }).first();

    if(!user) {
        res.status(404).json({
            success: false,
            message: "User not found"
        });

        return;
    }

    res.json({
        success: true,
        user
    });
};