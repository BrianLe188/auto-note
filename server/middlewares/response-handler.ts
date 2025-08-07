import { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Response {
      success: (data?: any, message?: string, status?: number) => void;
    }
  }
}

export function responseHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  res.success = (data = null, message = "OK", status = 200) => {
    res.status(status).json({
      success: true,
      message,
      data,
    });
  };

  next();
}
