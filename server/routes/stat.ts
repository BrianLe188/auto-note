import { Router } from "express";
import { getStats } from "@server/controllers/stat";

export function registerStatRoutes() {
  const router = Router();

  router.get("/", getStats);

  return router;
}
