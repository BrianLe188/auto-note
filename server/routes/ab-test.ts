import { Router } from "express";
import { getAbTests, getAbTestResults } from "@server/controllers/ab-test";

export function registerAbTestRoutes() {
  const router = Router();

  router.get("/", getAbTests);

  router.get("/results", getAbTestResults);

  return router;
}
