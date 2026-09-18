import { cleanBase64AndMime } from "./utils.js";
import {
  getProductById,
  uploadProductImageToStorage,
  addProductImage,
} from "./supabase.js";

export interface RemoveBgRequestParams {
  image?: string;
  baseImage?: string;
  image_file_b64?: string;
  image_url?: string;
  productId?: string;
  product_id?: string;
  callerArtisanId?: string;
}

export interface RemoveBgResponseData {
  success: boolean;
  imageUrl?: string;
  publicUrl?: string;
  dataUrl?: string;
  base64?: string;
  storagePath?: string;
  productId?: string;
  error_code?: string;
  error?: string;
  [key: string]: any;
}

export async function executeRemoveBackground(
  params: RemoveBgRequestParams
): Promise<{ status: number; data: RemoveBgResponseData }> {
  const apiKey = process.env.REMOVE_BG_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    return {
      status: 500,
      data: {
        success: false,
        error_code: "MISSING_REMOVE_BG_API_KEY",
        error:
          "REMOVE_BG_API_KEY environment variable is not configured on the server. Please add your remove.bg API key to your environment variables.",
      },
    };
  }

  const rawImage =
    params.image ||
    params.baseImage ||
    params.image_file_b64 ||
    params.image_url;

  if (!rawImage || typeof rawImage !== "string" || rawImage.trim().length === 0) {
    return {
      status: 400,
      data: {
        success: false,
        error_code: "BAD_REQUEST",
        error: "No image provided for background removal. Please provide image data as base64 or URL.",
      },
    };
  }

  const productId = params.productId || params.product_id;
  const callerArtisanId = params.callerArtisanId;

  // Prepare payload for remove.bg API
  const removeBgPayload: Record<string, any> = {
    size: "auto",
    format: "png",
  };

  const trimmed = rawImage.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      // Fetch URL server-side into a buffer to ensure accessibility
      const fetched = await fetch(trimmed);
      if (fetched.ok) {
        const arrBuf = await fetched.arrayBuffer();
        removeBgPayload.image_file_b64 = Buffer.from(arrBuf).toString("base64");
      } else {
        removeBgPayload.image_url = trimmed;
      }
    } catch {
      removeBgPayload.image_url = trimmed;
    }
  } else {
    const { data: cleanBase64 } = cleanBase64AndMime(trimmed, "image/jpeg");
    removeBgPayload.image_file_b64 = cleanBase64;
  }

  try {
    const removeBgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(removeBgPayload),
    });

    if (removeBgRes.status === 429) {
      return {
        status: 429,
        data: {
          success: false,
          error_code: "REMOVE_BG_RATE_LIMIT",
          error: "Background removal limit reached. Please try again later.",
        },
      };
    }

    if (!removeBgRes.ok) {
      let errorMsg = `remove.bg API failed with status ${removeBgRes.status}`;
      let errorCode = `REMOVE_BG_${removeBgRes.status}`;

      try {
        const errJson: any = await removeBgRes.json();
        if (Array.isArray(errJson?.errors) && errJson.errors[0]?.title) {
          errorMsg = errJson.errors[0].title;
          if (errJson.errors[0].code) {
            errorCode = errJson.errors[0].code;
          }
        } else if (errJson?.message) {
          errorMsg = errJson.message;
        }
      } catch {
        // Response was not JSON
      }

      if (removeBgRes.status === 401 || removeBgRes.status === 403) {
        errorCode = "REMOVE_BG_AUTH_ERROR";
      }

      return {
        status:
          removeBgRes.status >= 400 && removeBgRes.status < 600
            ? removeBgRes.status
            : 500,
        data: {
          success: false,
          error_code: errorCode,
          error: errorMsg,
        },
      };
    }

    // remove.bg returns binary transparent PNG buffer
    const arrayBuf = await removeBgRes.arrayBuffer();
    const pngBuffer = Buffer.from(arrayBuf);
    const pngBase64 = pngBuffer.toString("base64");
    const transparentDataUrl = `data:image/png;base64,${pngBase64}`;

    // Check if productId already exists in database
    let existingProduct: any = null;
    if (productId && typeof productId === "string") {
      try {
        existingProduct = await getProductById(productId);
      } catch {
        existingProduct = null;
      }
    }

    if (existingProduct) {
      // IF productId already exists:
      // upload the processed image immediately to Supabase Storage
      // insert its URL into product_images
      const artisanId = callerArtisanId || existingProduct.artisan_id;
      const targetProductId = existingProduct.product_id || existingProduct.id;

      const storageResult = await uploadProductImageToStorage({
        artisanId,
        productId: targetProductId,
        imageBufferOrBase64: pngBuffer,
        imageType: "enhanced",
        contentType: "image/png",
      });

      const imageRecord = await addProductImage(
        targetProductId,
        {
          image_url: storageResult.publicUrl,
          image_type: "enhanced",
          is_primary: true,
        },
        artisanId
      );

      return {
        status: 200,
        data: {
          success: true,
          imageUrl: storageResult.publicUrl,
          publicUrl: storageResult.publicUrl,
          storagePath: storageResult.storagePath,
          dataUrl: transparentDataUrl,
          base64: transparentDataUrl,
          productId: targetProductId,
          imageRecord,
        },
      };
    }

    // IF productId does NOT exist yet:
    // return the processed image to the frontend temporarily
    // DO NOT invent a product ID
    // DO NOT store it with a fake product ID
    return {
      status: 200,
      data: {
        success: true,
        imageUrl: transparentDataUrl,
        dataUrl: transparentDataUrl,
        base64: transparentDataUrl,
      },
    };
  } catch (err: any) {
    console.error("[RemoveBG] Processing error:", err);
    return {
      status: 500,
      data: {
        success: false,
        error_code: "REMOVE_BG_PROCESSING_ERROR",
        error:
          err?.message ||
          "An unexpected error occurred while communicating with remove.bg",
      },
    };
  }
}
