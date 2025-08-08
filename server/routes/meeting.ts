import { Router } from "express";
import {
  meetingUpload,
  getMeetings,
  getMeetingById,
  searchMeeting,
  getActionsOfMeeting,
} from "@server/controllers/meeting";
import { authenticateUser } from "@server/middlewares/auth";
import { upload } from "@server/middlewares/upload";

export function registerMeetingRoutes() {
  const router = Router();

  router.post(
    "/upload",
    authenticateUser,
    upload.single("audioFile"),
    meetingUpload,
  );

  router.get("", authenticateUser, getMeetings);

  router.get("/:id", authenticateUser, getMeetingById);

  router.get("/search/:query", authenticateUser, searchMeeting);

  router.get("/:id/action-items", authenticateUser, getActionsOfMeeting);

  return router;
}
