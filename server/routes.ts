import { Router, type Express, type Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import {
  transcribeAudio,
  extractActionItems,
  calculateAccuracyRate,
} from "./services/openai";
import { insertMeetingSchema, insertActionItemSchema } from "@shared/schema";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const multerStorage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const newName = `${name}-${Date.now()}${ext}`;
    cb(null, newName);
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = [".mp3", ".mp4", ".wav", ".m4a"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only MP3, MP4, WAV, and M4A files are allowed.",
      ),
    );
  }
};

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload and start transcription
  const router = Router();

  router.post(
    "/api/meetings/upload",
    upload.single("audioFile"),
    async (req: MulterRequest, res) => {
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
    },
  );

  // Get all meetings
  router.get("/api/meetings", async (req, res) => {
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
  });

  // Get specific meeting
  router.get("/api/meetings/:id", async (req, res) => {
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
  });

  // Search meetings
  router.get("/api/meetings/search/:query", async (req, res) => {
    try {
      const meetings = await storage.searchMeetings(req.params.query);
      res.json(meetings);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get action items for a meeting
  router.get("/api/meetings/:id/action-items", async (req, res) => {
    try {
      const actionItems = await storage.getActionItemsByMeeting(req.params.id);
      res.json(actionItems);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get all action items
  router.get("/api/action-items", async (req, res) => {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;
      const actionItems = await storage.getAllActionItems(limit);
      res.json(actionItems);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update action item
  router.patch("/api/action-items/:id", async (req, res) => {
    try {
      const updates = req.body;
      const actionItem = await storage.updateActionItem(req.params.id, updates);
      if (!actionItem) {
        return res.status(404).json({ message: "Action item not found" });
      }
      res.json(actionItem);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get A/B tests
  router.get("/api/ab-tests", async (req, res) => {
    try {
      const tests = await storage.getAbTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get test results for A/B testing dashboard
  router.get("/api/ab-tests/results", async (req, res) => {
    try {
      const tests = await storage.getAbTests();
      const results = await Promise.all(
        tests.map(async (test) => {
          const testResults = await storage.getTestResults(test.id);
          const avgAccuracy =
            testResults.length > 0
              ? Math.round(
                  testResults.reduce(
                    (sum, r) => sum + (r.accuracyRate || 0),
                    0,
                  ) / testResults.length,
                )
              : 0;
          const avgProcessingTime =
            testResults.length > 0
              ? Math.round(
                  (testResults.reduce(
                    (sum, r) => sum + (r.processingTime || 0),
                    0,
                  ) /
                    testResults.length /
                    60) *
                    10,
                ) / 10
              : 0;
          const avgActionItems =
            testResults.length > 0
              ? Math.round(
                  testResults.reduce(
                    (sum, r) => sum + (r.actionItemsFound || 0),
                    0,
                  ) / testResults.length,
                )
              : 0;

          return {
            ...test,
            metrics: {
              accuracyRate: avgAccuracy,
              processingTime: avgProcessingTime,
              actionItemsFound: avgActionItems,
              testCount: testResults.length,
            },
          };
        }),
      );
      res.json(results);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Dashboard stats
  router.get("/api/stats", async (req, res) => {
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
  });

  // Export functionality
  router.get("/api/export/:type", async (req, res) => {
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
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.use(router);

  const httpServer = createServer(app);
  return httpServer;
}

// Background transcription processing
async function processTranscription(
  meetingId: string,
  filePath: string,
  abTestGroup: string,
) {
  try {
    // Get the A/B test configuration
    const tests = await storage.getAbTests();
    const test = tests.find((t) => t.model === abTestGroup) || tests[0];

    const startTime = Date.now();

    // Transcribe audio
    const transcriptionResult = await transcribeAudio(filePath);

    // Extract action items using the test prompt
    const actionItems = await extractActionItems(
      transcriptionResult.text,
      test.prompt,
      test.model,
    );

    const processingTime = Math.round((Date.now() - startTime) / 1000);

    // Update meeting with transcription
    await storage.updateMeeting(meetingId, {
      status: "completed",
      transcriptionText: transcriptionResult.text,
      duration: transcriptionResult.duration,
    });

    // Create action items
    for (const item of actionItems) {
      await storage.createActionItem({
        meetingId,
        text: item.text,
        assignee: item.assignee || null,
        priority: item.priority,
        dueDate: item.dueDate || null,
        completed: false,
      });
    }

    // Calculate and store test results
    const accuracyRate = await calculateAccuracyRate(
      actionItems,
      transcriptionResult.text,
    );
    await storage.createTestResult({
      testId: test.id,
      meetingId,
      accuracyRate,
      processingTime,
      actionItemsFound: Math.round(
        (actionItems.length / transcriptionResult.text.length) * 1000,
      ), // Items per 1000 characters
    });

    // Clean up uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });
  } catch (error) {
    console.error("Transcription processing error:", error);
    await storage.updateMeeting(meetingId, {
      status: "failed",
    });
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");

  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        return typeof value === "string"
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      })
      .join(","),
  );

  return [csvHeaders, ...csvRows].join("\n");
}
