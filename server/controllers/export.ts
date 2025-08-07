import { NextFunction, Request, Response } from "express";
import { convertToCSV } from "@server/services/export";
import { storage } from "@server/storage";
import { AuthRequest } from "@server/middlewares/auth";
import { AppError } from "@server/middlewares/error-handler";

export async function exportByType(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { type } = req.params;
    const format = req.query.format || "json";

    let data;
    let filename;

    switch (type) {
      case "meetings":
        data = await storage.getMeetings();
        filename = `meetings_export_${new Date().toISOString().split("T")[0]}`;
        break;
      case "action-items":
        data = await storage.getAllActionItems();
        filename = `action_items_export_${new Date().toISOString().split("T")[0]}`;
        break;
      default:
        return res.status(400).json({ message: "Invalid export type" });
    }

    if (format === "csv") {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.csv"`,
      );
      res.send(csv);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.json"`,
      );
      res.json(data);
    }
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}

export async function exportMeetings(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { format = "csv", status, date } = req.query;
    const meetings = await storage.getMeetings();

    let filteredMeetings = meetings;

    // Apply filters
    if (status && status !== "all") {
      filteredMeetings = filteredMeetings.filter((m) => m.status === status);
    }

    if (date && date !== "all") {
      const now = new Date();
      const meetingDate = new Date();

      switch (date) {
        case "today":
          filteredMeetings = filteredMeetings.filter((m) => {
            const mDate = new Date(m.date);
            return mDate.toDateString() === now.toDateString();
          });
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredMeetings = filteredMeetings.filter((m) => {
            const mDate = new Date(m.date);
            return mDate >= weekAgo;
          });
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredMeetings = filteredMeetings.filter((m) => {
            const mDate = new Date(m.date);
            return mDate >= monthAgo;
          });
          break;
      }
    }

    if (format === "csv") {
      const csvHeader =
        "Title,Date,Participants,Status,Duration (minutes),File Name,Created At\n";
      const csvData = filteredMeetings
        .map((meeting) => {
          const duration = meeting.duration
            ? Math.round(meeting.duration / 60)
            : 0;
          const createdAt = new Date(meeting.createdAt)
            .toISOString()
            .split("T")[0];
          return `"${meeting.title}","${meeting.date}","${meeting.participants}","${meeting.status}","${duration}","${meeting.fileName}","${createdAt}"`;
        })
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="meetings-export.csv"',
      );
      res.send(csvHeader + csvData);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="meetings-export.json"',
      );
      res.json({
        exportDate: new Date().toISOString(),
        totalMeetings: filteredMeetings.length,
        meetings: filteredMeetings.map((meeting) => ({
          ...meeting,
          durationMinutes: meeting.duration
            ? Math.round(meeting.duration / 60)
            : 0,
        })),
      });
    } else {
      next(new AppError("Unsupported format. Use 'csv' or 'json'", 500));
    }
  } catch (error) {
    next(new AppError("Failed to export meetings", 500));
  }
}

export async function exportActionItems(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { format = "csv", priority, status } = req.query;
    const actionItems = await storage.getAllActionItems();
    const meetings = await storage.getMeetings();

    let filteredItems = actionItems;

    // Apply filters
    if (priority && priority !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.priority === priority,
      );
    }

    if (status && status !== "all") {
      if (status === "completed") {
        filteredItems = filteredItems.filter((item) => item.completed);
      } else if (status === "pending") {
        filteredItems = filteredItems.filter((item) => !item.completed);
      }
    }

    // Enrich with meeting titles
    const enrichedItems = filteredItems.map((item) => {
      const meeting = meetings.find((m) => m.id === item.meetingId);
      return {
        ...item,
        meetingTitle: meeting?.title || "Unknown Meeting",
      };
    });

    if (format === "csv") {
      const csvHeader =
        "Text,Assignee,Priority,Due Date,Status,Meeting,Created At\n";
      const csvData = enrichedItems
        .map((item) => {
          const status = item.completed ? "Completed" : "Pending";
          const createdAt = new Date(item.createdAt)
            .toISOString()
            .split("T")[0];
          const dueDate = item.dueDate || "Not set";
          const assignee = item.assignee || "Unassigned";
          return `"${item.text}","${assignee}","${item.priority}","${dueDate}","${status}","${item.meetingTitle}","${createdAt}"`;
        })
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="action-items-export.csv"',
      );
      res.send(csvHeader + csvData);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="action-items-export.json"',
      );
      res.json({
        exportDate: new Date().toISOString(),
        totalActionItems: enrichedItems.length,
        actionItems: enrichedItems,
      });
    } else {
      next(new AppError("Unsupported format. Use 'csv' or 'json'", 400));
    }
  } catch (error) {
    next(new AppError("Failed to export action items", 500));
  }
}

export async function exportMeetingById(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const { format = "txt" } = req.query;

    const meeting = await storage.getMeeting(id);
    if (!meeting) {
      return next(new AppError("Meeting not found", 404));
    }

    const actionItems = await storage.getActionItemsByMeeting(id);

    if (format === "txt") {
      const content = `MEETING TRANSCRIPT
==================

Title: ${meeting.title}
Date: ${meeting.date}
Participants: ${meeting.participants}
Duration: ${meeting.duration ? Math.round(meeting.duration / 60) : 0} minutes

TRANSCRIPT
----------
${meeting.transcriptionText || "Transcription not available"}

ACTION ITEMS
------------
${
  actionItems.length > 0
    ? actionItems
        .map(
          (item, index) =>
            `${index + 1}. ${item.text}
   Assignee: ${item.assignee || "Unassigned"}
   Priority: ${item.priority}
   Due Date: ${item.dueDate || "Not set"}
   Status: ${item.completed ? "Completed" : "Pending"}`,
        )
        .join("\n\n")
    : "No action items found"
}

Generated on: ${new Date().toLocaleString()}
`;

      res.setHeader("Content-Type", "text/plain");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${meeting.title.replace(/[^a-zA-Z0-9]/g, "_")}_transcript.txt"`,
      );
      res.send(content);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${meeting.title.replace(/[^a-zA-Z0-9]/g, "_")}_data.json"`,
      );
      res.json({
        meeting,
        actionItems,
        exportDate: new Date().toISOString(),
      });
    } else {
      next(new AppError("Unsupported format. Use 'txt' or 'json'", 400));
    }
  } catch (error) {
    next(new AppError("Failed to export meeting", 500));
  }
}
