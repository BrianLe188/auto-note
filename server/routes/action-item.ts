import { Router } from "express";
import {
  getActionItems,
  getActionItemById,
  generateDescription,
} from "@server/controllers/action-item";
import { authenticateUser } from "@server/middlewares/auth";

export function registerActionItemRoutes() {
  const router = Router();

  router.get("/", getActionItems);

  router.patch("/:id", getActionItemById);

  router.post(
    "/:id/generate-description",
    authenticateUser,
    generateDescription,
  );

  return router;
}
