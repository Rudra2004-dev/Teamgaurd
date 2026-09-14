import crypto from "crypto";
import bcrypt from "bcrypt";

export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");
};


export const hashRefreshToken = async (token: string) => {
    return bcrypt.hash(token, 10);
}