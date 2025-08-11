import { AuthRequest } from "@server/middlewares/auth";
import { AppError } from "@server/middlewares/error-handler";
import { storage } from "@server/storage";
import { NextFunction, Response } from "express";

export async function getAsset(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user;

    if (!user) {
      return next(new AppError("Invalid credentials", 401));
    }

    const asset = await storage.getAssetByUser(user.id);

    res.json(asset);
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}
