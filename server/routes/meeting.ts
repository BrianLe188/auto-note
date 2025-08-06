import { Router } from "express";
import {
  meetingUpload,
  getMeetings,
  getMeetingById,
  searchMeeting,
  getActionsOfMeeting,
} from "@server/controllers/meeting";
import { optionalAuth } from "@server/middlewares/auth";
import { upload } from "@server/middlewares/upload";

export function registerMeetingRoutes() {
  const router = Router();

  router.post(
    "/upload",
    optionalAuth,
    upload.single("audioFile"),
    meetingUpload,
  );

  router.get("", getMeetings);

  router.get("/:id", getMeetingById);

  router.get("/search/:query", searchMeeting);

  router.get("/:id/action-items", getActionsOfMeeting);

  return router;
}
