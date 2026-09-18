import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createArtisan,
  getArtisanById,
  updateArtisan,
  extractArtisanIdFromRequest,
} from "../../lib/server/supabase.js";
import { sendJson, sendSafeJsonError } from "../../lib/server/utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method?.toUpperCase();
  const id = (req.query?.id as string) || (req.query?.artisan_id as string);

  try {
    if (method === "POST") {
      const { name, email, phone, profile_image, craft, location, state, language, bio } = req.body || {};
      if (!name || String(name).trim().length === 0) {
        return sendJson(res, 400, { success: false, error: "Artisan name is required" });
      }

      const artisan = await createArtisan({
        id: req.body.id,
        name: String(name).trim(),
        email,
        phone,
        profile_image,
        craft,
        location,
        state,
        language: language || "en",
        bio,
      });

      return sendJson(res, 201, { success: true, data: artisan });
    }

    if (method === "GET") {
      if (!id) {
        return sendJson(res, 400, { success: false, error: "Artisan ID is required in query (?id=...)" });
      }

      const artisan = await getArtisanById(id);
      if (!artisan) {
        return sendJson(res, 404, { success: false, error: `Artisan with ID "${id}" not found` });
      }

      return sendJson(res, 200, { success: true, data: artisan });
    }

    if (method === "PUT") {
      if (!id) {
        return sendJson(res, 400, { success: false, error: "Artisan ID is required in query (?id=...)" });
      }

      const callerArtisanId = await extractArtisanIdFromRequest(req);
      if (callerArtisanId && callerArtisanId !== id) {
        return sendJson(res, 403, { success: false, error: "Unauthorized: Cannot edit another artisan's profile" });
      }

      const updated = await updateArtisan(id, req.body || {});
      return sendJson(res, 200, { success: true, data: updated });
    }

    return sendJson(res, 405, { success: false, error: `Method ${method} Not Allowed` });
  } catch (err: any) {
    return sendSafeJsonError(res, err, "Artisan operation failed");
  }
}
