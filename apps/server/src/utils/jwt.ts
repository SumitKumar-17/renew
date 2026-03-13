import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface TokenPayload {
    id: string;
    name: string;
    role: string;
    status: string;
    digesterId: string | null;
}

export const signAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    } as jwt.SignOptions);
};

export const signRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};