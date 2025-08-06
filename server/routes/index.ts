import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./auth";
import { registerMeetingRoutes } from "./meeting";
import { registerActionItemRoutes } from "./action-item";
import { registerAbTestRoutes } from "./ab-test";
import { registerStatRoutes } from "./stat";
import { registerExportRoutes } from "./export";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api/auth", registerAuthRoutes());

  app.use("/api/meetings", registerMeetingRoutes());

  app.use("/api/action-items", registerActionItemRoutes());

  app.use("/api/ab-tests", registerAbTestRoutes());

  app.use("/api/stats", registerStatRoutes());

  app.use("/api/export", registerExportRoutes());

  const httpServer = createServer(app);

  return httpServer;
}
