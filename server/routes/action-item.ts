import { Router } from "express";
import {
  getActionItems,
  getActionItemById,
  generateDescription,
} from "@server/controllers/action-item";

export function registerActionItemRoutes() {
  const router = Router();

  router.get("/", getActionItems);

  router.patch("/:id", getActionItemById);

  router.post("/:id/generate-description", generateDescription);

  return router;
}
