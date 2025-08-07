import { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  public status: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.status = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(`Error: ${err.message}`);

  const status = err.status || err.statusCode || 500;

  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
}
