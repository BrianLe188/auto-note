import { NextFunction, Request, Response } from "express";
import { MulterRequest } from "@server/middlewares/upload";
import { processTranscription } from "@server/services/meeting";
import { storage } from "@server/storage";
import { AppError } from "@server/middlewares/error-handler";
import { AuthRequest } from "@server/middlewares/auth";

export async function meetingUpload(
  req: MulterRequest & AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.file) {
      return next(new AppError("No file uploaded", 400));
    }

    const { title, date, participants, abTestGroup = "default" } = req.body;

    const user = req.user!;

    if (!title || !date || !participants) {
      return next(new AppError("Missing required fields", 400));
    }

    // Create meeting record
    const meetingData = {
      title,
      date,
      participants,
      fileName: req.file.originalname,
      filePath: req.file.path,
      status: "processing",
      abTestGroup,
      userId: user.id,
    };

    const meeting = await storage.createMeeting(meetingData);

    // Start transcription process (async)
    processTranscription(meeting.id, user.id, req.file.path, abTestGroup);

    res.json({
      meeting,
      message: "Upload successful, transcription started",
    });
  } catch (error) {
    console.error(error);
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}

export async function getMeetings(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user;

    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;

    const meetings = await storage.getMeetings(limit, user?.id);

    res.json(meetings);
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}

export async function getMeetingById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const meeting = await storage.getMeeting(req.params.id);
    if (!meeting) {
      return next(new AppError("Meeting not found", 404));
    }
    res.json(meeting);
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}

export async function searchMeeting(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const meetings = await storage.searchMeetings(req.params.query);
    res.json(meetings);
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}

export async function getActionsOfMeeting(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const actionItems = await storage.getActionItemsByMeeting(req.params.id);
    res.json(actionItems);
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}
