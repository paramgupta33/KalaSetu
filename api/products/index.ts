import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
  setProductPublishStatus,
  uploadProductImageToStorage,
  extractArtisanIdFromRequest,
  createOrUpdatePricing,
  getPricingByProductId,
  createMarketplaceListing,
  getMarketplaceListingsByProductId,
  saveFullProduct,
} from "../../lib/server/supabase.js";
import { sendJson, sendSafeJsonError } from "../../lib/server/utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method?.toUpperCase();
  const id = (req.query?.id || req.body?.id || req.body?.product_id) as string;
  const action = req.query?.action as string; // 'publish' | 'unpublish' | 'images'
  const imageId = req.query?.imageId as string;

  try {
    // 1. GET /api/products or /api/products?id=... or /api/products?artisan_id=...
    if (method === "GET") {
      if (id) {
        if (action === "pricing") {
          const pricing = await getPricingByProductId(id);
          return sendJson(res, 200, { success: true, data: pricing });
        }
        if (action === "marketplace_listings") {
          const listings = await getMarketplaceListingsByProductId(id);
          return sendJson(res, 200, { success: true, data: listings });
        }

        const product = await getProductById(id);
        if (!product) {
          return sendJson(res, 404, { success: false, error: `Product with ID "${id}" not found` });
        }
        res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
        return sendJson(res, 200, { success: true, data: product });
      }

      const { category, status, artisan_id, search, limit, offset } = req.query;
      const products = await getProducts({
        category: typeof category === "string" ? category : undefined,
        status: typeof status === "string" ? (status as any) : undefined,
        artisan_id: typeof artisan_id === "string" ? artisan_id : undefined,
        search: typeof search === "string" ? search : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      if (artisan_id) {
        res.setHeader("Cache-Control", "private, max-age=15, stale-while-revalidate=60");
      } else {
        res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
      }

      return sendJson(res, 200, { success: true, data: products, count: products.length });
    }

    // 2. POST /api/products or /api/products?id=...&action=publish / unpublish / images
    if (method === "POST") {
      const callerArtisanId = await extractArtisanIdFromRequest(req);

      // Sub-action: Publish
      if (id && action === "publish") {
        const published = await setProductPublishStatus(id, "published", callerArtisanId || undefined);
        return sendJson(res, 200, {
          success: true,
          data: published,
          message: "Product published to marketplace successfully",
        });
      }

      // Sub-action: Unpublish
      if (id && action === "unpublish") {
        const unpublished = await setProductPublishStatus(id, "draft", callerArtisanId || undefined);
        return sendJson(res, 200, {
          success: true,
          data: unpublished,
          message: "Product moved back to draft status",
        });
      }

      // Sub-action: Pricing
      if (id && action === "pricing") {
        const pricing = await createOrUpdatePricing(id, req.body || {}, callerArtisanId || undefined);
        return sendJson(res, 200, { success: true, data: pricing });
      }

      // Sub-action: Marketplace Listings
      if (id && action === "marketplace_listings") {
        const listing = await createMarketplaceListing(id, req.body || {}, callerArtisanId || undefined);
        return sendJson(res, 201, { success: true, data: listing });
      }

      // Sub-action: Add Image
      if (id && action === "images") {
        const product = await getProductById(id);
        if (!product) {
          return sendJson(res, 404, { success: false, error: `Product with ID "${id}" not found` });
        }

        if (callerArtisanId && product.artisan_id !== callerArtisanId) {
          return sendJson(res, 403, {
            success: false,
            error: "Unauthorized: Cannot add images to another artisan's product",
          });
        }

        const { image_url, image_base64, image, image_type = "original", is_primary = false } = req.body || {};
        let finalImageUrl = image_url;

        const base64Data = image_base64 || image;
        if (!finalImageUrl && base64Data && typeof base64Data === "string") {
          const storageResult = await uploadProductImageToStorage({
            artisanId: product.artisan_id,
            productId: product.id,
            imageBufferOrBase64: base64Data,
            imageType: image_type,
          });
          finalImageUrl = storageResult.publicUrl;
        }

        if (!finalImageUrl || typeof finalImageUrl !== "string") {
          return sendJson(res, 400, {
            success: false,
            error: "Either image_url or image (base64) must be provided",
          });
        }

        const imageRecord = await addProductImage(
          id,
          {
            image_url: finalImageUrl,
            image_type,
            is_primary: Boolean(is_primary),
          },
          callerArtisanId || undefined
        );

        return sendJson(res, 201, { success: true, data: imageRecord });
      }

      // Base: Create Product
      const artisan_id = callerArtisanId || req.body?.artisan_id;
      if (!artisan_id || String(artisan_id).trim().length === 0) {
        return sendJson(res, 400, {
          success: false,
          error: "artisan_id is required. Please specify the artisan owner ID.",
        });
      }

      const {
        title,
        description,
        category,
        category_label,
        sub_category,
        materials,
        specifications,
        dimensions,
        tags,
        price,
        stock,
        status = "draft",
        image_url,
        images,
        pricing,
        marketplace_listings,
      } = req.body || {};

      if (!title || String(title).trim().length === 0) {
        return sendJson(res, 400, { success: false, error: "Product title is required" });
      }
      if (!category || String(category).trim().length === 0) {
        return sendJson(res, 400, { success: false, error: "Product category is required" });
      }

      if (typeof price === "number" && price < 0) {
        return sendJson(res, 400, { success: false, error: "Price cannot be negative" });
      }
      if (typeof stock === "number" && stock < 0) {
        return sendJson(res, 400, { success: false, error: "Stock count cannot be negative" });
      }

      if (status === "published" && (!price || price <= 0)) {
        return sendJson(res, 400, {
          success: false,
          error: "Published products must have a retail price greater than 0",
        });
      }

      const fullProduct = await saveFullProduct(
        {
          id: req.body?.id,
          artisan_id,
          title: String(title).trim(),
          description: description ? String(description).trim() : "",
          category: String(category).trim().toLowerCase(),
          category_label,
          sub_category,
          materials,
          specifications,
          dimensions,
          tags,
          price: typeof price === "number" ? price : 0,
          stock: typeof stock === "number" ? stock : 1,
          status: status === "published" ? "published" : "draft",
          image_url,
          images,
          pricing,
          marketplace_listings,
        },
        callerArtisanId || undefined
      );

      return sendJson(res, 201, { success: true, data: fullProduct });
    }

    // 3. PUT /api/products?id=... - Update Product
    if (method === "PUT") {
      if (!id) {
        return sendJson(res, 400, { success: false, error: "Product ID is required in query (?id=...)" });
      }

      const callerArtisanId = await extractArtisanIdFromRequest(req);
      const updated = await updateProduct(id, req.body || {}, callerArtisanId || undefined);

      return sendJson(res, 200, { success: true, data: updated });
    }

    // 4. DELETE /api/products?id=... or /api/products?id=...&action=images&imageId=...
    if (method === "DELETE") {
      if (!id) {
        return sendJson(res, 400, { success: false, error: "Product ID is required in query (?id=...)" });
      }

      const callerArtisanId = await extractArtisanIdFromRequest(req);

      if (action === "images" && imageId) {
        await deleteProductImage(id, imageId, callerArtisanId || undefined);
        return sendJson(res, 200, { success: true, message: "Product image deleted successfully" });
      }

      await deleteProduct(id, callerArtisanId || undefined);
      return sendJson(res, 200, { success: true, message: "Product deleted successfully" });
    }

    return sendJson(res, 405, { success: false, error: `Method ${method} Not Allowed` });
  } catch (err: any) {
    return sendSafeJsonError(res, err, "Product operation failed");
  }
}
