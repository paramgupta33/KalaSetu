import type { VercelRequest, VercelResponse } from "@vercel/node";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { getGenAI, sendJson, sendSafeJsonError } from "../../lib/server/utils.js";

// Calibrated Flipkart Indian E-Commerce Dataset Regressor
function calculateNativeMarketPrice(params: {
  product_name?: string;
  primary_category?: string;
  sub_category?: string;
  brand?: string;
  description?: string;
  spec_count?: number;
  image_count?: number;
  category_depth?: number;
}): { predicted_price: number; currency: string } {
  const pName = String(params.product_name || "").toLowerCase();
  const desc = String(params.description || "").toLowerCase();
  const combined = `${pName} ${desc}`;
  const pCat = String(params.primary_category || "Home Decor & Festive Needs");

  const categoryTE: Record<string, number> = {
    "Home Decor & Festive Needs": 6.95,
    "Kitchen & Dining": 6.78,
    Clothing: 7.15,
    Jewellery: 7.62,
    "Handicrafts & Art": 7.08,
    Furniture: 7.95,
    Footwear: 6.92,
    "Bags, Wallets & Belts": 6.84,
    "Beauty and Personal Care": 6.62,
    "Sports & Fitness": 6.9,
    "Tools & Hardware": 6.88,
  };

  const highValueKeywords: Record<string, number> = {
    pure: 0.12,
    handcrafted: 0.15,
    handmade: 0.12,
    authentic: 0.1,
    silk: 0.25,
    brass: 0.22,
    bronze: 0.28,
    copper: 0.2,
    terracotta: 0.08,
    ceramic: 0.14,
    marble: 0.3,
    wood: 0.12,
    teak: 0.25,
    sheesham: 0.22,
    silver: 0.35,
    gold: 0.45,
    antique: 0.2,
    vintage: 0.15,
    handwoven: 0.18,
    embroidery: 0.15,
    pottery: 0.1,
    sculpture: 0.25,
    painting: 0.2,
    leather: 0.22,
  };

  const baseLog = categoryTE[pCat] || 6.85;
  const specBoost = Math.min(10, Math.max(0, Number(params.spec_count) || 0)) * 0.035;
  const imgBoost = Math.min(5, Math.max(1, Number(params.image_count) || 1)) * 0.04;
  const depthBoost = Math.min(4, Math.max(1, Number(params.category_depth) || 2)) * 0.02;

  const words = combined.split(/\s+/).filter(Boolean);
  const lengthBoost = Math.min(0.15, words.length * 0.002);

  let craftBoost = 0.0;
  for (const [kw, weight] of Object.entries(highValueKeywords)) {
    if (combined.includes(kw)) {
      craftBoost = Math.min(0.55, craftBoost + weight * 0.5);
    }
  }

  const finalLog = baseLog + specBoost + imgBoost + depthBoost + lengthBoost + craftBoost;
  let predictedINR = Math.expm1(finalLog);
  predictedINR = Math.max(49.0, Math.round(predictedINR * 100) / 100);

  return {
    predicted_price: predictedINR,
    currency: "INR",
  };
}

async function handleExtractCosts(req: VercelRequest, res: VercelResponse) {
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

  const { text } = body;
  if (!text) {
    return sendJson(res, 400, {
      success: false,
      error_code: "BAD_REQUEST",
      error: "Spoken or typed text is required",
    });
  }

  const customKey =
    (req.headers["x-gemini-api-key"] as string) || body.apiKey;
  const apiKey = customKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = getGenAI(customKey);
      const extractionPrompt = `You are a financial cost extraction assistant for Indian artisans.
The user spoke or typed their product cost breakdown: "${text}".

Extract numbers into JSON with these exact fields:
- "material_cost": number or null (cost of raw materials: clay, brass, silk, quartz, etc.)
- "labour_cost": number or null (artisan's own total effort/craftsmanship valuation, not hourly rate)
- "packaging_cost": number or null (box, padding, packaging materials)
- "other_costs": number or null (kiln firing, workshop electricity, transport, miscellaneous)

Rules:
1. If a field was not mentioned or the artisan said "I don't know", return null for that field. DO NOT default to 0.
2. Return ONLY raw JSON without markdown backticks.`;

      const geminiResp = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [{ text: extractionPrompt }],
        config: {
          responseMimeType: "application/json",
        },
      });

      const geminiText = geminiResp.text?.trim() || "{}";
      const parsed = JSON.parse(geminiText);

      return sendJson(res, 200, {
        success: true,
        source: "gemini",
        costs: {
          material_cost:
            typeof parsed.material_cost === "number" ? parsed.material_cost : null,
          labour_cost:
            typeof parsed.labour_cost === "number" ? parsed.labour_cost : null,
          packaging_cost:
            typeof parsed.packaging_cost === "number"
              ? parsed.packaging_cost
              : null,
          other_costs:
            typeof parsed.other_costs === "number" ? parsed.other_costs : null,
        },
      });
    } catch (geminiErr: any) {
      console.warn("[Vercel /api/pricing/extract-costs] Gemini fallback:", geminiErr?.message || geminiErr);
    }
  }

  return sendJson(res, 200, {
    success: true,
    source: "client_fallback",
    message: "Use client regex parser",
  });
}

async function handleMarketEstimate(req: VercelRequest, res: VercelResponse) {
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

  const {
    product_name = "",
    primary_category = "Unknown",
    sub_category = "Unknown",
    brand = "Unbranded / Independent",
    description = "",
    spec_count = 0,
    image_count = 1,
    category_depth = 2,
  } = body;

  const payloadData = {
    product_name: String(product_name || "").trim(),
    primary_category: String(primary_category || "Unknown").trim(),
    sub_category: String(sub_category || "Unknown").trim(),
    brand: String(brand || "Unbranded / Independent").trim(),
    description: String(description || "").trim(),
    spec_count: Number(spec_count) || 0,
    image_count: Number(image_count) || 1,
    category_depth: Number(category_depth) || 2,
  };

  // 1. External FastAPI Pricing Service via PRICING_API_URL
  const pricingApiUrl = process.env.PRICING_API_URL?.trim()?.replace(/\/+$/, "");
  if (pricingApiUrl) {
    try {
      console.log(`[Pricing] Calling external FastAPI XGBoost service at ${pricingApiUrl}/predict-price`);
      const apiRes = await fetch(`${pricingApiUrl}/predict-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadData),
      });

      if (apiRes.ok) {
        const result = await apiRes.json();
        return sendJson(res, 200, {
          success: true,
          model: "xgboost_external_fastapi",
          predicted_price: result.predicted_price,
          currency: result.currency || "INR",
        });
      } else {
        console.warn(`[Pricing] External service returned ${apiRes.status}`);
      }
    } catch (apiErr: any) {
      console.warn("[Pricing] External FastAPI call failed:", apiErr.message);
    }
  }

  // 2. In Vercel serverless environment, use calibrated native estimate
  const isVercel = Boolean(process.env.VERCEL);
  if (isVercel) {
    const nativeEstimate = calculateNativeMarketPrice(payloadData);
    return sendJson(res, 200, {
      success: true,
      model: "flipkart_calibrated_market_model",
      ...nativeEstimate,
      note: "For full external XGBoost microservice integration on Vercel, set PRICING_API_URL.",
    });
  }

  // 3. Local / container environment: execute python3 predict.py if available
  const nativeEstimate = calculateNativeMarketPrice(payloadData);
  const predictScript = path.join(process.cwd(), "pricing_model", "predict.py");

  if (!fs.existsSync(predictScript)) {
    return sendJson(res, 200, {
      success: true,
      model: "flipkart_calibrated_market_model",
      ...nativeEstimate,
    });
  }

  try {
    const inputPayload = JSON.stringify(payloadData);
    const py = spawn("python3", [predictScript, inputPayload], {
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    return await new Promise<void>((resolve) => {
      const finishOnce = (output: any) => {
        if (finished) return;
        finished = true;
        sendJson(res, 200, output);
        resolve();
      };

      py.on("error", (err) => {
        console.warn("Python execution error, using calibrated native engine:", err.message);
        finishOnce({
          success: true,
          model: "flipkart_calibrated_market_model",
          ...nativeEstimate,
        });
      });

      py.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      py.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      py.on("close", (code) => {
        if (code !== 0) {
          return finishOnce({
            success: true,
            model: "flipkart_calibrated_market_model",
            ...nativeEstimate,
          });
        }

        try {
          const lines = stdout.trim().split("\n");
          const jsonLine = lines.reverse().find((l) => l.trim().startsWith("{"));
          if (!jsonLine) {
            throw new Error("No JSON found in output");
          }
          const parsed = JSON.parse(jsonLine);
          finishOnce({
            success: true,
            model: parsed.model || "xgboost_indian_ecommerce_retail_price",
            ...parsed,
          });
        } catch {
          finishOnce({
            success: true,
            model: "flipkart_calibrated_market_model",
            ...nativeEstimate,
          });
        }
      });
    });
  } catch (err: any) {
    return sendJson(res, 200, {
      success: true,
      model: "flipkart_calibrated_market_model",
      ...nativeEstimate,
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return sendJson(res, 405, {
      success: false,
      error_code: "METHOD_NOT_ALLOWED",
      error: "Only POST requests are supported for this endpoint",
    });
  }

  // Determine sub-route
  let subRoute = "";
  if (Array.isArray(req.query?.slug)) {
    subRoute = req.query.slug[0] || "";
  } else if (typeof req.query?.slug === "string") {
    subRoute = req.query.slug;
  } else if (req.url) {
    const cleanPath = req.url.split("?")[0].replace(/^\/api\/pricing\/?/, "");
    subRoute = cleanPath.split("/")[0] || "";
  }

  if (subRoute === "extract-costs") {
    return handleExtractCosts(req, res);
  } else if (subRoute === "market-estimate" || subRoute === "" || !subRoute) {
    return handleMarketEstimate(req, res);
  }

  return sendJson(res, 404, {
    success: false,
    error: `Unknown pricing endpoint: /api/pricing/${subRoute}`,
  });
}
