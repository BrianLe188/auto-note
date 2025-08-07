import { NextFunction, Request, Response } from "express";
import { storage } from "@server/storage";
import { AppError } from "@server/middlewares/error-handler";

export async function getActionItems(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;
    const actionItems = await storage.getAllActionItems(limit);
    res.json(actionItems);
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}

export async function getActionItemById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const updates = req.body;
    const actionItem = await storage.updateActionItem(req.params.id, updates);
    if (!actionItem) {
      return res.status(404).json({ message: "Action item not found" });
    }
    res.json(actionItem);
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}
