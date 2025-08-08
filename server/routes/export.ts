import { Router } from "express";
import {
  exportActionItems,
  exportByType,
  exportMeetingById,
  exportMeetings,
} from "@server/controllers/export";
import { authenticateUser } from "@server/middlewares/auth";

export function registerExportRoutes() {
  const router = Router();

  router.get("/meetings", authenticateUser, exportMeetings);

  router.get("/action-items", authenticateUser, exportActionItems);

  router.get("/meeting/:id", authenticateUser, exportMeetingById);

  router.get("/:type", authenticateUser, exportByType);

  return router;
}
