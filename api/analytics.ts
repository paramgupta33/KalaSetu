import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  extractUserIdFromRequest,
  getArtisanAnalyticsData,
  recordAnalyticsEvent,
} from "../lib/server/supabase.js";
import { sendJson, sendSafeJsonError } from "../lib/server/utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method?.toUpperCase();

  try {
    // 1. POST /api/analytics (Record an analytics event e.g. PRODUCT_VIEW, PRODUCT_CLICK, PRODUCT_SAVE, ADD_TO_CART)
    if (method === "POST") {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          return sendJson(res, 400, {
            success: false,
            error: "Invalid JSON body",
          });
        }
      }
      body = body || {};

      const { product_id, event_type, metadata } = body;
      if (!product_id || !event_type) {
        return sendJson(res, 400, {
          success: false,
          error: "product_id and event_type are required",
        });
      }

      // Allow optional user auth (buyer or visitor)
      let userId: string | null = null;
      try {
        userId = await extractUserIdFromRequest(req);
      } catch {}

      const result = await recordAnalyticsEvent({
        user_id: userId,
        product_id: String(product_id),
        event_type: String(event_type),
        metadata,
      });

      return sendJson(res, 200, {
        success: true,
        data: result,
      });
    }

    // 2. GET /api/analytics (Fetch authenticated artisan's real analytics)
    if (method === "GET") {
      const userId = await extractUserIdFromRequest(req);
      if (!userId) {
        return sendJson(res, 401, {
          success: false,
          error: "Authentication required to access artisan analytics",
        });
      }

      const period = (req.query?.period as string) || "30d";
      const productId = (req.query?.product_id as string) || undefined;

      const analytics = await getArtisanAnalyticsData(userId, {
        period,
        productId,
      });

      return sendJson(res, 200, {
        success: true,
        data: analytics,
      });
    }

    return sendJson(res, 405, {
      success: false,
      error: `Method ${method} not allowed`,
    });
  } catch (error: any) {
    console.error("[Vercel /api/analytics] Error:", error);
    return sendSafeJsonError(res, error, "Internal server error in analytics");
  }
}
