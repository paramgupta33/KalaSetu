import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getGenAI, cleanBase64AndMime, sendJson, sendSafeJsonError } from "../../lib/server/utils.js";

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

  const model = "gemini-3.6-flash";

  try {
    const customKey =
      (req.headers["x-gemini-api-key"] as string) || body.apiKey;
    const ai = getGenAI(customKey);
    const { prompt, image, language = "en" } = body;

    // 1. IMAGE VALIDATION ACTION (/api/ai/chat with action="validate-image")
    if (
      body.action === "validate-image" ||
      body.task === "validate-image" ||
      req.query?.action === "validate-image"
    ) {
      const defaultFailMessage =
        language === "hi"
          ? "कृपया एक स्पष्ट उत्पाद-केंद्रित फोटो अपलोड करें।"
          : "Please upload a clear product-focused image.";

      if (!image || typeof image !== "string" || !image.trim()) {
        return sendJson(res, 200, {
          success: false,
          isValid: false,
          confidence: 0.0,
          productIdentified: null,
          hasHuman: false,
          reason: "No image provided",
          userMessage: defaultFailMessage,
        });
      }

      const { data, mimeType: imgMime } = cleanBase64AndMime(image, "image/jpeg");
      if (!data) {
        return sendJson(res, 200, {
          success: false,
          isValid: false,
          confidence: 0.0,
          productIdentified: null,
          hasHuman: false,
          reason: "Invalid image data format",
          userMessage: defaultFailMessage,
        });
      }

      const validationParts: any[] = [
        {
          inlineData: {
            mimeType: imgMime,
            data: data,
          },
        },
        {
          text: `Analyze this photograph carefully to determine if it contains a clearly identifiable product or craft suitable for an e-commerce catalogue listing.

VALIDATION INSTRUCTIONS:
1. VALID (isValid = true):
   - The image clearly shows a tangible Indian handicraft, artwork, handloom textile, jewelry, pottery, metalware, woodcraft, stone craft, painting, or handmade product.
   - The craft/product is identifiable and in reasonable focus.
   - HUMAN / ARTISAN IN IMAGE: A human being (such as an artisan holding the item, wearing a handloom garment/jewelry, or shaping pottery) DOES NOT automatically make the image invalid! If an artisan is holding, wearing, or showcasing a clearly visible craft/product, IT IS VALID.

2. INVALID (isValid = false):
   - Pure human selfies, face portraits, personal photos where NO clear craft or product is being showcased.
   - Random scenery, empty floors, walls, ceilings, non-craft furniture, laptop/phone screens, vehicles, animals, or documents.
   - Images that are excessively blurry, dark, washed out, obscured, or corrupted such that no product can be identified.
   - Any image where AI cannot identify a specific craft or product.

Return ONLY a valid JSON object matching this schema:
{
  "isValid": boolean,
  "confidence": number between 0 and 1,
  "productIdentified": string or null,
  "craftCategory": string or null,
  "hasHuman": boolean,
  "reason": string,
  "userMessage": string
}

IMPORTANT:
If isValid is false, userMessage must be: "Please upload a clear product-focused image." (in Hindi: "कृपया एक स्पष्ट उत्पाद-केंद्रित फोटो अपलोड करें।").
If isValid is true, userMessage must confirm the identified craft.`,
        },
      ];

      const validationSystemInstruction = `You are an expert Indian artisan craft inspector and product image validator for KalaSetu.
Your mandate is to block selfies, random non-product scenes, blurry photos, and unidentifiable objects, while warmly approving authentic crafts (including those held, worn, or demonstrated by an artisan).
Always output valid JSON only.`;

      try {
        const response = await ai.models.generateContent({
          model,
          contents: validationParts,
          config: {
            systemInstruction: validationSystemInstruction,
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });

        let parsed: any = null;
        try {
          parsed = JSON.parse(response.text || "{}");
        } catch {
          const match = (response.text || "").match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          }
        }

        if (!parsed || typeof parsed.isValid !== "boolean") {
          return sendJson(res, 200, {
            success: true,
            model,
            isValid: false,
            confidence: 0.0,
            productIdentified: null,
            craftCategory: null,
            hasHuman: false,
            reason: "AI could not identify a product in the image",
            userMessage: defaultFailMessage,
          });
        }

        const isValid = Boolean(parsed.isValid);
        return sendJson(res, 200, {
          success: true,
          model,
          isValid: isValid,
          confidence:
            typeof parsed.confidence === "number"
              ? parsed.confidence
              : isValid
              ? 0.95
              : 0.1,
          productIdentified: isValid
            ? parsed.productIdentified || "Handcrafted Heritage Item"
            : null,
          craftCategory: isValid ? parsed.craftCategory || "craft" : null,
          hasHuman: Boolean(parsed.hasHuman),
          reason:
            parsed.reason ||
            (isValid
              ? "Craft clearly identified"
              : "Product not clearly identifiable"),
          userMessage: isValid
            ? parsed.userMessage ||
              (language === "hi"
                ? "उत्पाद फोटो सत्यापित!"
                : "Product image verified!")
            : defaultFailMessage,
        });
      } catch (validationErr: any) {
        console.warn("[Vercel /api/ai/chat validate-image] Error:", validationErr?.message || validationErr);
        return sendJson(res, 200, {
          success: false,
          isValid: false,
          confidence: 0.0,
          productIdentified: null,
          hasHuman: false,
          reason: validationErr?.message || "Validation check could not complete",
          userMessage: defaultFailMessage,
        });
      }
    }

    if (!prompt && !image) {
      return sendJson(res, 400, {
        success: false,
        error_code: "BAD_REQUEST",
        error: "Prompt or image is required",
      });
    }

    const systemInstruction = `You are KalaAI, an expert Indian heritage craft mentor, storyteller, and catalogue specialist for KalaSetu.
Your goal is to empower rural and master Indian artisans (potters, handloom weavers, brass smiths, woodcarvers, Pichwai artists).
Respond warmly in ${language === "hi" ? "authentic, respectful Hindi (Devanagari script)" : "warm, polished English (with regional craft nuances)"}.
When analyzing craft images or queries:
1. Identify the authentic craft tradition (e.g. Jaipur Blue Pottery, Kutch Bandhani, Dhokra bell metal, Varanasi Zari).
2. Highlight authentic artisan touches, materials used, GI (Geographical Indication) authenticity, and festive seasonal appeal.
3. Suggest fair artisan pricing with honest festive discount structures.
4. Keep explanations conversational, encouraging, and ready for direct e-commerce marketplace listing.`;

    const parts: any[] = [];

    // If an image was passed (data URL or raw base64)
    if (image && typeof image === "string") {
      const { data, mimeType: imgMime } = cleanBase64AndMime(image, "image/jpeg");
      if (data) {
        parts.push({
          inlineData: {
            mimeType: imgMime,
            data: data,
          },
        });
      }
    }

    const userText =
      prompt ||
      (language === "hi"
        ? "कृपया इस शिल्प कलाकृति का विश्लेषण करें, इसकी प्रामाणिक शिल्प शैली बताएं और कैटलॉग के लिए सुंदर विवरण तैयार करें।"
        : "Please analyze this craft artwork, identify its authentic heritage style, and compose a story for catalogue listing.");

    parts.push({ text: userText });

    const responseMimeType = body.responseMimeType || (body.jsonMode ? "application/json" : undefined);
    const temperature = typeof body.temperature === "number" ? body.temperature : (responseMimeType === "application/json" ? 0.2 : 0.7);

    const response = await ai.models.generateContent({
      model,
      contents: parts,
      config: {
        systemInstruction,
        temperature,
        ...(responseMimeType ? { responseMimeType } : {}),
      },
    });

    const replyText = response.text || "";

    return sendJson(res, 200, {
      success: true,
      model,
      text: replyText,
      badge: language === "hi" ? `कलासेतु AI • ${model}` : `KalaAI • ${model}`,
    });
  } catch (error: any) {
    console.log("[Vercel /api/ai/chat] Model notice:", error?.status || error?.code || "handled");
    return sendSafeJsonError(res, error, "Failed to generate AI response", {
      model,
    });
  }
}
