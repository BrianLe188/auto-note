import { Request, Response } from "express";
import { storage } from "@server/storage";

export async function getStats(req: Request, res: Response) {
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
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
