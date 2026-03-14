import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { hashPassword } from "../../utils/hash";

export const operatorsService = {

    getAll: async () => {
        const operators = await prisma.user.findMany({
            where: { role: "operator" },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                name: true,
                phone: true,
                status: true,
                digesterId: true,
                createdAt: true,
                digester: {
                    select: { id: true, location: true },
                },
            },
        });

        return operators.map(op => ({
            id: op.id,
            name: op.name,
            phone: op.phone,
            status: op.status,
            digesterId: op.digesterId,
            digesterLocation: op.digester?.location ?? null,
            createdAt: op.createdAt.toISOString().split("T")[0],
        }));
    },

    create: async (data: {
        name: string;
        phone: string;
        password: string;
        digesterId?: string;
    }) => {
        // Auto-generate operator ID: OP001, OP002, ...
        const count = await prisma.user.count({ where: { role: "operator" } });
        const id = `OP${String(count + 1).padStart(3, "0")}`;

        // Check if digesterId exists and is not already assigned
        if (data.digesterId) {
            const digester = await prisma.digester.findUnique({
                where: { id: data.digesterId },
                include: { user: true },
            });
            if (!digester) {
                throw AppError.badRequest("Digester not found");
            }
            if (digester.user) {
                throw AppError.badRequest("Digester is already assigned to another operator");
            }
        }

        const passwordHash = await hashPassword(data.password);

        const operator = await prisma.user.create({
            data: {
                id,
                name: data.name,
                phone: data.phone,
                passwordHash,
                role: "operator",
                status: "active",
                digesterId: data.digesterId ?? null,
            },
        });

        return {
            id: operator.id,
            name: operator.name,
            phone: operator.phone,
            status: operator.status,
            digesterId: operator.digesterId,
            createdAt: operator.createdAt.toISOString().split("T")[0],
        };
    },

    updateStatus: async (id: string, status: string) => {
        const op = await prisma.user.findUnique({ where: { id, role: "operator" } });
        if (!op) throw AppError.notFound("Operator not found");

        return prisma.user.update({
            where: { id },
            data: { status },
            select: { id: true, name: true, status: true },
        });
    },
};
