import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  extractUserIdFromRequest,
  getUserById,
  createOrder,
  getOrdersForUser,
  getOrderById,
  updateOrderStatus,
} from "../../lib/server/supabase.js";
import { sendJson, sendSafeJsonError } from "../../lib/server/utils.js";

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

    // Determine sub-path segments from catch-all slug or fallback URL
    let slugArray: string[] = [];
    if (Array.isArray(req.query?.slug)) {
      slugArray = req.query.slug;
    } else if (typeof req.query?.slug === "string" && req.query.slug.trim().length > 0) {
      slugArray = req.query.slug.split("/").filter(Boolean);
    } else if (req.url) {
      const cleanPath = req.url.split("?")[0].replace(/^\/api\/orders\/?/, "");
      if (cleanPath) {
        slugArray = cleanPath.split("/").filter(Boolean);
      }
    }

    // Route 1: /api/orders/:id/status (PUT/PATCH)
    if (slugArray.length >= 2 && slugArray[1] === "status") {
      const orderId = slugArray[0] || (req.query?.id as string) || (req.query?.order_id as string);
      if (!orderId) {
        return sendJson(res, 400, {
          success: false,
          error: "order_id is required",
        });
      }

      if (method === "PUT" || method === "PATCH") {
        const { status } = req.body || {};
        if (!status) {
          return sendJson(res, 400, {
            success: false,
            error: "Missing status field in request body",
          });
        }

        const updated = await updateOrderStatus(orderId, status, userId);
        return sendJson(res, 200, {
          success: true,
          data: updated,
        });
      }

      return sendJson(res, 405, { success: false, error: `Method ${method} Not Allowed` });
    }

    // Route 2: /api/orders/:id (GET)
    if (slugArray.length === 1 && slugArray[0] !== "index") {
      const orderId = slugArray[0] || (req.query?.id as string) || (req.query?.order_id as string);
      if (!orderId) {
        return sendJson(res, 400, {
          success: false,
          error: "order_id is required",
        });
      }

      if (method === "GET") {
        const order = await getOrderById(orderId, userId);
        if (!order) {
          return sendJson(res, 404, {
            success: false,
            error: `Order ${orderId} not found`,
          });
        }

        return sendJson(res, 200, {
          success: true,
          data: order,
        });
      }

      return sendJson(res, 405, { success: false, error: `Method ${method} Not Allowed` });
    }

    // Route 3: /api/orders (GET - List orders, POST - Create order)
    if (slugArray.length === 0 || (slugArray.length === 1 && slugArray[0] === "index")) {
      if (method === "GET") {
        const user = await getUserById(userId);
        const page = req.query?.page ? parseInt(req.query.page as string, 10) : undefined;
        const limit = req.query?.limit ? parseInt(req.query.limit as string, 10) : undefined;
        const orders = await getOrdersForUser(userId, user?.role, { page, limit });
        return sendJson(res, 200, {
          success: true,
          data: orders,
          pagination: {
            page: Math.max(1, page || 1),
            limit: Math.min(50, Math.max(1, limit || 20)),
            count: orders.length,
          },
        });
      }

      if (method === "POST") {
        const { product_id, quantity, items, shipping_address } = req.body || {};
        let orderItems = items;
        if (!orderItems && product_id) {
          orderItems = [{ product_id, quantity: Number(quantity) || 1 }];
        }

        if (!Array.isArray(orderItems) || orderItems.length === 0) {
          return sendJson(res, 400, {
            success: false,
            error: "At least one product item (product_id and quantity) is required",
          });
        }

        const newOrder = await createOrder({
          buyerId: userId,
          items: orderItems,
          shippingAddress: shipping_address,
        });

        return sendJson(res, 201, {
          success: true,
          data: newOrder,
        });
      }

      return sendJson(res, 405, { success: false, error: `Method ${method} Not Allowed` });
    }

    return sendJson(res, 404, {
      success: false,
      error_code: "ORDER_ROUTE_NOT_FOUND",
      error: `Orders route not found`,
    });
  } catch (err: any) {
    if (err.error_code === "INSUFFICIENT_STOCK" || err.status === 400) {
      console.warn("[Orders API] Error in /api/orders:", err.message);
    } else {
      console.error("[Orders API] Error in /api/orders:", err);
    }
    const status = err.status || (err.message?.includes("Only the artisan") || err.message?.includes("authorized") ? 403 : 400);
    return sendJson(res, status, {
      success: false,
      error_code: err.error_code || "ORDER_OPERATION_FAILED",
      error: err.message || "Failed to process orders request",
      product_id: err.product_id,
      available_stock: err.available_stock,
      requested_quantity: err.requested_quantity,
    });
  }
}
