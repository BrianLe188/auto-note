import { storage } from "@server/storage";
import {
  calculateAccuracyRate,
  extractActionItems,
  transcribeAudio,
} from "./openai";
import fs from "fs";
import { emitter } from "@server/eventbus";

export async function processTranscription(
  meetingId: string,
  filePath: string,
  abTestGroup: string,
) {
  try {
    // Get the A/B test configuration
    const tests = await storage.getAbTests();
    const test = tests.find((t) => t.model === abTestGroup) || tests[0];

    emitter.emit("meeting:init", { meetingId, percent: 10 });

    const startTime = Date.now();

    // Transcribe audio
    const transcriptionResult = await transcribeAudio(filePath);

    emitter.emit("meeting:init", { meetingId, percent: 30 });

    // Extract action items using the test prompt
    const actionItems = await extractActionItems(
      transcriptionResult.text,
      test.prompt,
      test.model,
    );

    emitter.emit("meeting:init", { meetingId, percent: 50 });

    const processingTime = Math.round((Date.now() - startTime) / 1000);

    // Update meeting with transcription
    await storage.updateMeeting(meetingId, {
      status: "completed",
      transcriptionText: transcriptionResult.text,
      duration: transcriptionResult.duration,
    });

    const actions = [];

    // Create action items
    for (const item of actionItems) {
      const action = await storage.createActionItem({
        meetingId,
        text: item.text,
        assignee: item.assignee || null,
        priority: item.priority,
        dueDate: item.dueDate || null,
        completed: false,
      });
      actions.push(action);
    }

    if (actions.length > 0) {
      emitter.emit("action:new-items", actions);
    }

    emitter.emit("meeting:init", { meetingId, percent: 70 });

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

    emitter.emit("meeting:init", { meetingId, percent: 100 });

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
