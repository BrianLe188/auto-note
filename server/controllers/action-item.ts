import { Request, Response } from "express";
import { storage } from "@server/storage";

export async function getActionItems(req: Request, res: Response) {
  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;
    const actionItems = await storage.getAllActionItems(limit);
    res.json(actionItems);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getActionItemById(req: Request, res: Response) {
  try {
    const updates = req.body;
    const actionItem = await storage.updateActionItem(req.params.id, updates);
    if (!actionItem) {
      return res.status(404).json({ message: "Action item not found" });
    }
    res.json(actionItem);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
