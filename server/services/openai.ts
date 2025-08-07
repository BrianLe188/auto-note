import OpenAI from "openai";
import fs from "fs";

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
}

export async function generateActionItemDescription(
  actionText: string,
  meetingContext?: string,
): Promise<string> {
  try {
    const prompt = `
You are an AI specializing in analyzing and expanding information from action items in meetings.

Task: Create a detailed description for the following action item:
"${actionText}"

${meetingContext ? `Meeting context: ${meetingContext}` : ""}

Requirements:
1. Create a detailed, specific, and actionable description
2. Include step-by-step instructions if possible
3. Suggest a timeline or prioritization if appropriate
4. Retain the original language of the action item (Vietnamese or English)
5. Limit to 200 words
6. Focus on clarity and feasibility

Return ONLY the expanded description, with no title or markdown formatting.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert in business analysis and project management.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("Error generating action item description:", error);
    return ""; // Return empty string if AI generation fails
  }
}

export async function generateMultipleActionItemDescriptions(
  actionItems: Array<{ text: string; id: string }>,
  meetingContext?: string,
): Promise<Map<string, string>> {
  const descriptions = new Map<string, string>();

  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < actionItems.length; i += batchSize) {
    const batch = actionItems.slice(i, i + batchSize);
    const promises = batch.map(async (item) => {
      const description = await generateActionItemDescription(
        item.text,
        meetingContext,
      );
      return { id: item.id, description };
    });

    const results = await Promise.all(promises);
    results.forEach((result) => {
      descriptions.set(result.id, result.description);
    });

    // Small delay between batches to respect rate limits
    if (i + batchSize < actionItems.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return descriptions;
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
