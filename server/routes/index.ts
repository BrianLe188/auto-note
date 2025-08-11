import { Router, type Express } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./auth";
import { registerMeetingRoutes } from "./meeting";
import { registerActionItemRoutes } from "./action-item";
import { registerAbTestRoutes } from "./ab-test";
import { registerStatRoutes } from "./stat";
import { registerExportRoutes } from "./export";
import { registerGumroadRoutes } from "./gumroad";
import { registerAssetRoutes } from "./asset";

function registerAPIRoutes() {
  const router = Router();

  router.use("/auth", registerAuthRoutes());

  router.use("/meetings", registerMeetingRoutes());

  router.use("/action-items", registerActionItemRoutes());

  router.use("/ab-tests", registerAbTestRoutes());

  router.use("/stats", registerStatRoutes());

  router.use("/export", registerExportRoutes());

  router.use("/gumroad", registerGumroadRoutes());

  router.use("/assets", registerAssetRoutes());

  return router;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api", registerAPIRoutes());

  const httpServer = createServer(app);

  return httpServer;
}
