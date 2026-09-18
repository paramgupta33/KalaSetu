import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getSupabaseClient,
  extractUserIdFromRequest,
  getUserById,
} from "../../lib/server/supabase.js";
import { sendJson, sendSafeJsonError } from "../../lib/server/utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method?.toUpperCase();

  try {
    const authHeader = req.headers?.authorization;
    const supabase = getSupabaseClient();

    if (!authHeader || !authHeader.startsWith("Bearer ") || !supabase) {
      return sendJson(res, 401, {
        success: false,
        error: "Authentication required. Please provide a valid Bearer token.",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return sendJson(res, 401, {
        success: false,
        error: error?.message || "Invalid or expired authentication token",
      });
    }

    if (method === "GET") {
      let dbUser = await getUserById(user.id);
      const role = dbUser?.role || (user.user_metadata?.role as string) || "artisan";
      return sendJson(res, 200, {
        success: true,
        user: dbUser || {
          user_id: user.id,
          id: user.id,
          name: (user.user_metadata?.name as string) || (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "User",
          email: user.email,
          phone: (user.user_metadata?.phone as string) || "",
          role,
          language: (user.user_metadata?.language as string) || (role === "buyer" ? "en" : "hi"),
        },
        token,
      });
    }

    if (method === "POST") {
      const { name, phone, language, role } = req.body || {};
      const updates: any = { user_id: user.id };
      if (name) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (language) updates.language = language;
      if (role) updates.role = role;

      const { data: updatedUser } = await supabase
        .from("users")
        .upsert(updates)
        .select()
        .maybeSingle();

      return sendJson(res, 200, {
        success: true,
        user: updatedUser || (await getUserById(user.id)),
        token,
      });
    }

    return sendJson(res, 405, { success: false, error: `Method ${method} Not Allowed` });
  } catch (err: any) {
    console.error("[Auth Session API] Error:", err);
    return sendJson(res, 500, {
      success: false,
      error: err.message || "Failed to process authentication session",
    });
  }
}


