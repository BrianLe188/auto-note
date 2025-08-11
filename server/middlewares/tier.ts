import { storage } from "@server/storage";
import { AuthRequest } from "./auth";
import { NextFunction, Response } from "express";
import { AppError } from "./error-handler";

export async function transcriptionCountCheck(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user;

    if (!user) {
      return next(new AppError("Authentication required", 401));
    }

    const asset = await storage.getAssetByUser(user.id);

    if (asset?.transcriptionCount === 0) {
      return next(new AppError("You have reached the limit", 429));
    }

    switch (asset?.currentTier) {
      case "Free": {
        break;
      }
      case "Basic": {
        break;
      }
      case "Pro": {
        break;
      }
    }

    next();
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
}
