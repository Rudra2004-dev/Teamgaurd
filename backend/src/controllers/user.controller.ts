import {Request, Response} from "express";
import type { User } from "../types/user.types.js";

let users: User[] = [];

export const createUser = (req: Request, res: Response) =>{
    const {name, email} = req.body;

    if(!name || !email) {
        res.status(400).json({
            success: false,
            message: "Name and email are required"
        });

        return;
    }

    const existingUser = users.find(
        (user) => user.email === email
    );

    if(existingUser) {
        res.status(409).json({
            success: false,
            message: "Email already exists"
        });

        return;
    }

    const user : User = {
        id: users.length + 1,
        name,
        email
    };

    users.push(user);

    res.status(201).json({
        success: true,
        user
    });
};

export const getUsers = (req: Request, res: Response) =>{
    res.json({
        success: true,
        users
    });
};

export const getUserById = (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const user = users.find(
        (user) => user.id === id
    );

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