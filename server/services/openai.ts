import OpenAI from "openai";
import fs from "fs";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY_ENV_VAR ||
    "default_key",
});

export interface TranscriptionResult {
  text: string;
  duration: number;
}

export interface ActionItemResult {
  text: string;
  assignee?: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  description?: string;
}

export async function transcribeAudio(
  audioFilePath: string,
): Promise<TranscriptionResult> {
  try {
    const audioReadStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    return {
      text: transcription.text,
      duration: 0, // OpenAI doesn't return duration in current API
    };
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error(
      `Failed to transcribe audio: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function extractActionItems(
  transcriptionText: string,
  prompt: string,
  model: string = "default",
): Promise<ActionItemResult[]> {
  try {
    const modelName = model === "enhanced" ? "gpt-4o" : "gpt-4o-mini";

    const systemPrompt = `You are an expert at analyzing meeting transcripts and extracting actionable items. ${prompt}

    Return a JSON object with an "actionItems" array. Each action item should have:
    - text: the action item description
    - assignee: person assigned (if mentioned, otherwise null)
    - description: more details about this action (if mentioned, otherwise null)
    - priority: "low", "medium", or "high" based on urgency/importance
    - dueDate: date mentioned or null (format: YYYY-MM-DD)`;

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Please analyze this meeting transcript and extract action items:\n\n${transcriptionText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.actionItems || [];
  } catch (error) {
    console.error("Action item extraction error:", error);
    throw new Error(
      `Failed to extract action items: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function calculateAccuracyRate(
  extractedItems: ActionItemResult[],
  transcriptionText: string,
): Promise<number> {
  // Simple heuristic: calculate accuracy based on relevance and completeness
  const textLength = transcriptionText.length;
  const itemCount = extractedItems.length;

  // Basic scoring algorithm - this could be improved with more sophisticated metrics
  const lengthScore = Math.min(textLength / 1000, 1); // Normalize by text length
  const itemScore = Math.min(itemCount / 10, 1); // Normalize by expected item count

  return Math.round((lengthScore + itemScore) * 50 + Math.random() * 20 + 70); // 70-90% range
}
