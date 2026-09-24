import crypto from "crypto";
import bcrypt from "bcrypt";

export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");
};


export const hashRefreshToken = async (token: string) => {
    return bcrypt.hash(token, 10);
}

export const generatePasswordResetToken = () => {
    return crypto.randomBytes(32).toString("hex");
};


export const generateEmailVerificationToken = () => {
    return crypto.randomBytes(32).toString("hex");
};