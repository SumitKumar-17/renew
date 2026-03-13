import { prisma } from "../../config/database";
import { comparePassword } from "../../utils/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken, TokenPayload } from "../../utils/jwt";
import { AppError } from "../../utils/AppError";
import { LoginDto } from "@renew-hope/shared";

export const authService = {

    login: async (dto: LoginDto) => {
        // 1. Find user by ID
        const user = await prisma.user.findUnique({
            where: { id: dto.id },
        });

        if (!user) {
            // Generic message — do not reveal whether ID or password is wrong
            throw AppError.unauthorized("Invalid credentials");
        }

        // 2. Check account is active
        if (user.status !== "active") {
            throw AppError.forbidden("Account has been deactivated");
        }

        // 3. Verify password
        const isValid = await comparePassword(dto.password, user.passwordHash);
        if (!isValid) {
            throw AppError.unauthorized("Invalid credentials");
        }

        // 4. Build token payload
        const payload: TokenPayload = {
            id: user.id,
            name: user.name,
            role: user.role,
            status: user.status,
            digesterId: user.digesterId,
        };

        // 5. Sign tokens
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        // 6. Return tokens + safe user object (no passwordHash)
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                status: user.status,
                digesterId: user.digesterId,
            },
        };
    },

    refresh: async (token: string) => {
        // 1. Verify refresh token
        const payload = verifyRefreshToken(token);

        // 2. Check user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: payload.id },
        });

        if (!user) {
            throw AppError.unauthorized("User no longer exists");
        }

        if (user.status !== "active") {
            throw AppError.forbidden("Account has been deactivated");
        }

        // 3. Issue new access token
        const newPayload: TokenPayload = {
            id: user.id,
            name: user.name,
            role: user.role,
            status: user.status,
            digesterId: user.digesterId,
        };

        const accessToken = signAccessToken(newPayload);

        return { accessToken };
    },

};