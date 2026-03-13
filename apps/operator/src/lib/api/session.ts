// src/lib/api/session.ts

export const getSession = () => {
    try {
        const stored = localStorage.getItem("auth_session");
        if (!stored) return null;
        return JSON.parse(stored) as {
            user: {
                id: string;
                name: string;
                role: string;
                digesterId: string | null;
                status: string;
            };
            token: string;
            refreshToken: string;
        };
    } catch {
        return null;
    }
};

export const getDigesterId = (): string => {
    const session = getSession();
    if (!session?.user?.digesterId) {
        throw new Error("No digester assigned to this operator");
    }
    return session.user.digesterId;
};