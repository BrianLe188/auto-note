import { Request, Response } from "express";
import { MulterRequest } from "@server/middlewares/upload";
import { processTranscription } from "@server/services/meeting";
import { storage } from "@server/storage";

export async function meetingUpload(req: MulterRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, date, participants, abTestGroup = "default" } = req.body;

    if (!title || !date || !participants) {
      return res.status(400).json({ message: "Missing required fields" });
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
    };

    const meeting = await storage.createMeeting(meetingData);

    // Start transcription process (async)
    processTranscription(meeting.id, req.file.path, abTestGroup);

    res.json({
      meeting,
      message: "Upload successful, transcription started",
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getMeetings(req: Request, res: Response) {
  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;
    const meetings = await storage.getMeetings(limit);
    res.json(meetings);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getMeetingById(req: Request, res: Response) {
  try {
    const meeting = await storage.getMeeting(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    res.json(meeting);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function searchMeeting(req: Request, res: Response) {
  try {
    const meetings = await storage.searchMeetings(req.params.query);
    res.json(meetings);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getActionsOfMeeting(req: Request, res: Response) {
  try {
    const actionItems = await storage.getActionItemsByMeeting(req.params.id);
    res.json(actionItems);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
