import { Router } from "express";
import {
  exportActionItems,
  exportByType,
  exportMeetingById,
  exportMeetings,
} from "@server/controllers/export";
import { optionalAuth } from "@server/middlewares/auth";

export function registerExportRoutes() {
  const router = Router();

  router.get("/meetings", optionalAuth, exportMeetings);

  router.get("/action-items", optionalAuth, exportActionItems);

  router.get("/meeting/:id", optionalAuth, exportMeetingById);

  router.get("/:type", exportByType);

  return router;
}
