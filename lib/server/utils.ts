import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export type ApiRequest = VercelRequest | any;
export type ApiResponse = VercelResponse | any;

export function getGenAI(customKey?: string): GoogleGenAI {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your Gemini API key in your environment variables."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export function cleanBase64AndMime(input: string, defaultMime = "audio/webm") {
  if (!input) return { data: "", mimeType: defaultMime };

  let data = input.trim();
  let mimeType = defaultMime;

  if (data.includes(";base64,")) {
    const parts = data.split(";base64,");
    const header = parts[0];
    data = parts.slice(1).join(";base64,").trim();
    if (header.startsWith("data:")) {
      const detected = header.replace(/^data:/, "").split(";")[0].trim();
      if (detected) mimeType = detected;
    }
  } else if (data.startsWith("data:")) {
    const commaIndex = data.indexOf(",");
    if (commaIndex !== -1) {
      const header = data.substring(0, commaIndex);
      data = data.substring(commaIndex + 1).trim();
      if (header.startsWith("data:")) {
        const detected = header.replace(/^data:/, "").split(";")[0].trim();
        if (detected) mimeType = detected;
      }
    }
  }

  if (mimeType.includes(";")) {
    mimeType = mimeType.split(";")[0].trim();
  }

  return { data, mimeType };
}

export function sendJson(res: ApiResponse, statusCode: number, data: any) {
  res.setHeader("Content-Type", "application/json");
  return res.status(statusCode).json(data);
}

export function sendSafeJsonError(
  res: ApiResponse,
  error: any,
  defaultMsg: string,
  extra: Record<string, any> = {}
) {
  let rawMsg = error?.message || defaultMsg;
  let parsedMsg = rawMsg;
  try {
    if (typeof rawMsg === "string" && rawMsg.trim().startsWith("{")) {
      const parsed = JSON.parse(rawMsg);
      if (parsed?.error?.message) {
        parsedMsg = parsed.error.message;
      }
    }
  } catch {}

  let statusCode = 500;
  if (typeof error?.status === "number" && error.status >= 400 && error.status <= 599) {
    statusCode = error.status;
  } else if (typeof error?.code === "number" && error.code >= 400 && error.code <= 599) {
    statusCode = error.code;
  } else if (rawMsg.includes("503") || rawMsg.includes("UNAVAILABLE") || rawMsg.includes("high demand")) {
    statusCode = 503;
  } else if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED") || rawMsg.includes("quota")) {
    statusCode = 429;
  }

  const isHighDemand =
    statusCode === 503 || rawMsg.includes("high demand") || rawMsg.includes("UNAVAILABLE");

  res.setHeader("Content-Type", "application/json");
  return res.status(statusCode).json({
    success: false,
    error_code: isHighDemand ? "MODEL_HIGH_DEMAND" : error?.error_code || `HTTP_${statusCode}`,
    error: parsedMsg,
    message: isHighDemand
      ? "This AI model is currently experiencing high demand. Please retry in a few moments."
      : parsedMsg,
    ...extra,
  });
}
