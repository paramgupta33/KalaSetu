import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendJson } from "../lib/server/utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  const hasApiKey = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0
  );

  return sendJson(res, 200, {
    status: "ok",
    hasApiKey,
    endpoints: {
      transcription: {
        configured: hasApiKey,
        model: "gemini-3.6-flash",
        path: "/api/ai/transcribe",
      },
      imageGeneration: {
        configured: hasApiKey,
        model: "gemini-3.1-flash-image",
        path: "/api/ai/generate-image",
      },
      productUnderstanding: {
        configured: hasApiKey,
        model: "gemini-3.6-flash",
        path: "/api/ai/chat",
      },
    },
    models: {
      transcription: "gemini-3.6-flash",
      image: "gemini-3.1-flash-image",
      productUnderstanding: "gemini-3.6-flash",
      chat: "gemini-3.6-flash",
    },
  });
}
