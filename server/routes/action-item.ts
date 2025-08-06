import { Router } from "express";
import {
  getActionItems,
  getActionItemById,
} from "@server/controllers/action-item";

export function registerActionItemRoutes() {
  const router = Router();

  router.get("/", getActionItems);

  router.patch("/:id", getActionItemById);

  return router;
}
