import type { VercelRequest, VercelResponse } from "@vercel/node";
import { executeRemoveBackground } from "../../lib/server/removeBg.js";
import { extractArtisanIdFromRequest } from "../../lib/server/supabase.js";
import { sendJson } from "../../lib/server/utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return sendJson(res, 405, {
      success: false,
      error_code: "METHOD_NOT_ALLOWED",
      error: "Only POST requests are supported for this endpoint",
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

  try {
    const callerArtisanId = await extractArtisanIdFromRequest(req);
    const result = await executeRemoveBackground({
      ...body,
      callerArtisanId: callerArtisanId || undefined,
    });

    return sendJson(res, result.status, result.data);
  } catch (err: any) {
    console.error("[Vercel /api/ai/remove-background] Handler error:", err);
    return sendJson(res, 500, {
      success: false,
      error_code: "INTERNAL_SERVER_ERROR",
      error: err?.message || "Failed to process background removal request",
    });
  }
}
