import { NextFunction, Request, Response } from "express";
import { storage } from "@server/storage";
import { AppError } from "@server/middlewares/error-handler";

export async function getStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const meetings = await storage.getMeetings();
    const actionItems = await storage.getAllActionItems();

    const thisMonth = new Date();
    thisMonth.setDate(1);

    const monthlyMeetings = meetings.filter(
      (m) => new Date(m.createdAt) >= thisMonth,
    );
    const monthlyActionItems = actionItems.filter(
      (ai) => new Date(ai.createdAt) >= thisMonth,
    );

    // Calculate hours saved (estimate 30 min per meeting for manual processing)
    const hoursSaved = monthlyMeetings.length * 0.5;

    res.json({
      meetingsTranscribed: monthlyMeetings.length,
      actionItems: monthlyActionItems.length,
      hoursSaved: Math.round(hoursSaved * 10) / 10,
    });
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}
