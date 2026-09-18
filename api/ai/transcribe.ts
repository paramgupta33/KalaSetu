import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getGenAI,
  cleanBase64AndMime,
  sendJson,
  sendSafeJsonError,
} from "../../lib/server/utils.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return sendJson(res, 405, {
      success: false,
      error_code: "METHOD_NOT_ALLOWED",
      error: "Only POST requests are supported",
    });
  }

  let body = req.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return sendJson(res, 400, {
        success: false,
        error_code: "INVALID_JSON",
        error: "Request body must be valid JSON",
      });
    }
  }

  body = body || {};

  // Use a normal Gemini Flash model for speech transcription.
  // This avoids the current EMPTY_TRANSCRIPTION issue seen with
  // gemini-3.5-transcribe.
  const model = "gemini-3.6-flash";

  try {
    const customKey =
      (req.headers["x-gemini-api-key"] as string) || body.apiKey;

    const ai = getGenAI(customKey);

    const {
      audioBase64,
      mimeType = "audio/webm",
      language = "en",
    } = body;

    if (!audioBase64) {
      return sendJson(res, 400, {
        success: false,
        error_code: "BAD_REQUEST",
        error: "audioBase64 is required",
      });
    }

    const { data: cleanBase64, mimeType: cleanMime } =
      cleanBase64AndMime(
        audioBase64,
        mimeType ? mimeType.split(";")[0].trim() : "audio/webm"
      );

    const audioPart = {
      inlineData: {
        mimeType: cleanMime,
        data: cleanBase64,
      },
    };

    const languageInstruction =
      language === "hi"
        ? "The speaker is primarily speaking Hindi. Transcribe the Hindi speech exactly."
        : "The speaker is primarily speaking English. Transcribe the English speech exactly.";

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          text: `
You are a speech-to-text transcription system.

${languageInstruction}

Listen carefully to the provided audio.

Return ONLY the spoken words as plain text.

Do NOT:
- explain anything
- describe the audio
- add quotation marks
- add markdown
- add labels such as "Transcript:"
- invent words when speech is unclear

If the speaker pauses, simply continue the transcription.
Preserve the meaning and wording of what was actually spoken.
          `.trim(),
        },
        audioPart,
      ],
      config: {
        temperature: 0,
      },
    });

    let transcribedText = response.text?.trim() || "";

    if (!transcribedText && response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          transcribedText += part.text;
        }
      }

      transcribedText = transcribedText.trim();
    }

    console.log("[Voice] transcription result:", {
      model,
      language,
      mimeType: cleanMime,
      textLength: transcribedText.length,
    });

    if (!transcribedText) {
      return sendJson(res, 422, {
        success: false,
        error_code: "EMPTY_TRANSCRIPTION",
        model,
        text: "",
        error:
          "No speech could be transcribed from the recording. Please speak clearly and try again.",
      });
    }

    return sendJson(res, 200, {
      success: true,
      model,
      text: transcribedText,
    });
  } catch (error: any) {
    console.error(
      "[Vercel /api/ai/transcribe] Error:",
      error?.message || error
    );

    return sendSafeJsonError(
      res,
      error,
      "Failed to transcribe audio",
      { model }
    );
  }
}