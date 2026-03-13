export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        // Maintains proper stack trace in V8
        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, AppError.prototype);
    }

    // Convenience static methods
    static badRequest(message: string) { return new AppError(message, 400); }
    static unauthorized(message: string) { return new AppError(message, 401); }
    static forbidden(message: string) { return new AppError(message, 403); }
    static notFound(message: string) { return new AppError(message, 404); }
    static internal(message: string) { return new AppError(message, 500); }
}