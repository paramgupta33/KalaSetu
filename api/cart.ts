import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  extractUserIdFromRequest,
  getCartForUser,
  addToCartForUser,
  updateCartItemQuantityForUser,
  removeFromCartForUser,
  clearCartForUser,
} from "../lib/server/supabase.js";
import { sendJson, sendSafeJsonError } from "../lib/server/utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method?.toUpperCase();

  try {
    const userId = await extractUserIdFromRequest(req);
    if (!userId) {
      return sendJson(res, 401, {
        success: false,
        error: "Authentication required. Please provide a valid Bearer token.",
      });
    }

    if (method === "GET") {
      const items = await getCartForUser(userId);
      return sendJson(res, 200, {
        success: true,
        data: items,
      });
    }

    if (method === "POST") {
      const { product_id, quantity = 1 } = req.body || {};
      if (!product_id) {
        return sendJson(res, 400, {
          success: false,
          error: "product_id is required",
        });
      }

      const addedItem = await addToCartForUser(userId, String(product_id), Number(quantity));
      return sendJson(res, 201, {
        success: true,
        data: addedItem,
      });
    }

    if (method === "PUT" || method === "PATCH") {
      const { product_id, quantity } = req.body || {};
      if (!product_id) {
        return sendJson(res, 400, {
          success: false,
          error: "product_id is required",
        });
      }
      if (quantity === undefined || quantity === null) {
        return sendJson(res, 400, {
          success: false,
          error: "quantity is required",
        });
      }

      const updated = await updateCartItemQuantityForUser(
        userId,
        String(product_id),
        Number(quantity)
      );
      return sendJson(res, 200, {
        success: true,
        data: updated,
      });
    }

    if (method === "DELETE") {
      const isClearAll =
        req.query?.clear_all === "true" ||
        req.query?.all === "true" ||
        req.body?.clear_all === true ||
        req.body?.all === true;

      if (isClearAll) {
        await clearCartForUser(userId);
        return sendJson(res, 200, {
          success: true,
          message: "Cart cleared successfully",
        });
      }

      const productId =
        (req.query?.product_id as string) ||
        (req.query?.id as string) ||
        (req.body?.product_id as string) ||
        (req.body?.id as string);

      if (!productId) {
        return sendJson(res, 400, {
          success: false,
          error: "product_id is required to remove an item, or specify clear_all=true",
        });
      }

      await removeFromCartForUser(userId, productId);
      return sendJson(res, 200, {
        success: true,
        message: "Item removed from cart",
        product_id: productId,
      });
    }

    return sendJson(res, 405, {
      success: false,
      error: `Method ${method} Not Allowed`,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return sendSafeJsonError(res, status, error.message || "Cart operation failed", {
      error_code: error.error_code,
      available_stock: error.available_stock,
      requested_quantity: error.requested_quantity,
      product_id: error.product_id,
    });
  }
}
