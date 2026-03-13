import "express";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                role: "admin" | "operator";
                status: string;
                digesterId: string | null;
            };
        }
    }
}