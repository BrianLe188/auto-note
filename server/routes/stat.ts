import { Router } from "express";
import { getStats } from "@server/controllers/stat";
import { authenticateUser } from "@server/middlewares/auth";

export function registerStatRoutes() {
  const router = Router();

  router.get("/", authenticateUser, getStats);

  return router;
}
