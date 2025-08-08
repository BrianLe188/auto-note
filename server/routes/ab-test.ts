import { Router } from "express";
import { getAbTests, getAbTestResults } from "@server/controllers/ab-test";
import { authenticateUser } from "@server/middlewares/auth";

export function registerAbTestRoutes() {
  const router = Router();

  router.get("/", authenticateUser, getAbTests);

  router.get("/results", authenticateUser, getAbTestResults);

  return router;
}
