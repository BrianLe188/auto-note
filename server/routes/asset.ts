import { getAsset } from "@server/controllers/asset";
import { authenticateUser } from "@server/middlewares/auth";
import { Router } from "express";

export function registerAssetRoutes() {
  const router = Router();

  router.get("", authenticateUser, getAsset);

  return router;
}
