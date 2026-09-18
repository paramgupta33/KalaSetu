/**
 * Client service connecting to KalaSetu Express backend
 * powering Gemini models:
 * - gemini-3.6-flash for product understanding & craft storytelling
 * - gemini-3.5-transcribe for audio voice-to-text conversion
 * - gemini-3.1-flash-image for studio craft photography generation & enhancement
 */

// Base API URL configuration. Since backend API routes are co-hosted on port 3000 via Express,
// we use direct relative root paths (e.g. "/api/...") by default.
// If VITE_API_BASE_URL is provided, we strictly validate that it starts with http:// or https://
// to prevent invalid path prefixes (like raw API keys or tokens).
function getBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) {
    const customUrl = String((import.meta as any).env.VITE_API_BASE_URL).trim();
    if (customUrl.startsWith('http://') || customUrl.startsWith('https://')) {
      return customUrl.replace(/\/+$/, '');
    }
  }
  return '';
}

const API_BASE_URL = getBaseUrl();

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  errorCode?: string;
  isHtml?: boolean;
}

/**
 * Safely fetches an API route, inspecting status and content-type before parsing JSON.
 * Rejects and diagnoses HTML responses instead of throwing "Unexpected token '<'".
 */
export async function safeApiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retries = 1
): Promise<SafeFetchResult<T>> {
  const targetUrl = getApiUrl(endpoint);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(targetUrl, options);
      const contentType = res.headers.get('content-type') || '';
      const status = res.status;

      // Handle non-JSON / HTML responses safely without swallowing routing errors
      if (contentType.includes('text/html')) {
        const htmlSnippet = await res.text();
        const cleanSnippet = htmlSnippet.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
        
        // If the server is in the middle of starting or rebooting, wait and retry
        const isServerStarting = cleanSnippet.toLowerCase().includes('starting') || 
                                 cleanSnippet.toLowerCase().includes('server') ||
                                 cleanSnippet.toLowerCase().includes('please wait');
        if (isServerStarting && attempt < retries) {
          console.warn(`[API Notice] Server starting (${targetUrl}). Retrying in ${(attempt + 1) * 1200}ms...`);
          await new Promise((r) => setTimeout(r, (attempt + 1) * 1200));
          continue;
        }

        console.error(`[API Routing Error] Endpoint: ${targetUrl}, Status: ${status}, Content-Type: ${contentType}. Preview: ${cleanSnippet}`);
        return {
          ok: false,
          status,
          data: null,
          isHtml: true,
          errorCode: 'API_ROUTE_RETURNED_HTML',
          error: `API route ${endpoint} returned HTML (HTTP ${status}) instead of JSON. Check that this serverless API route is deployed.`,
        };
      }

      const rawText = await res.text();
      if (!rawText || !rawText.trim()) {
        if (!res.ok) {
          return {
            ok: false,
            status,
            data: null,
            errorCode: `HTTP_${status}`,
            error: `API request failed with HTTP ${status} (empty response body).`,
          };
        }
        return {
          ok: true,
          status,
          data: null,
        };
      }

      let parsedJson: any;
      try {
        parsedJson = JSON.parse(rawText);
      } catch (jsonErr: any) {
        console.error(`[API Error: MALFORMED_JSON] Endpoint: ${targetUrl}, Status: ${status}, Content-Type: ${contentType}. Content: ${rawText.slice(0, 150)}`);
        return {
          ok: false,
          status,
          data: null,
          errorCode: 'MALFORMED_JSON',
          error: `Received invalid JSON response from ${targetUrl} (Status ${status}): ${jsonErr.message}`,
        };
      }

      if (!res.ok) {
        const isHighDemand = status === 503 || parsedJson?.error_code === 'MODEL_HIGH_DEMAND' || parsedJson?.error?.includes?.('high demand');
        if (isHighDemand && attempt < retries) {
          console.warn(`[API Notice] Model high demand on ${targetUrl}. Retrying in 1200ms...`);
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        const errMsg = parsedJson?.error || parsedJson?.message || `API error with HTTP ${status}`;
        return {
          ok: false,
          status,
          data: parsedJson,
          errorCode: parsedJson?.error_code || `HTTP_${status}`,
          error: errMsg,
        };
      }

      return {
        ok: true,
        status,
        data: parsedJson,
      };
    } catch (networkErr: any) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      console.error(`[API Error: NETWORK_ERROR] Endpoint: ${targetUrl}`, networkErr.message || networkErr);
      return {
        ok: false,
        status: 0,
        data: null,
        errorCode: 'NETWORK_ERROR',
        error: networkErr.message || 'Network connection failed while calling API service',
      };
    }
  }

  return {
    ok: false,
    status: 500,
    data: null,
    errorCode: 'UNKNOWN_ERROR',
    error: 'Request could not be completed. Please try again.',
  };
}

export interface CraftChatResponse {
  success: boolean;
  model: string;
  text: string;
  badge?: string;
  error?: string;
  errorCode?: string;
}

export interface TranscribeResponse {
  success: boolean;
  model: string;
  text: string;
  error?: string;
  errorCode?: string;
}

export interface ImageGenResponse {
  success: boolean;
  model: string;
  imageUrl?: string;
  text?: string;
  error?: string;
  errorCode?: string;
  quotaNotice?: string;
  quotaExceeded?: boolean;
}

export interface ImageValidationResult {
  success?: boolean;
  isValid: boolean;
  confidence?: number;
  productIdentified?: string | null;
  craftCategory?: string | null;
  hasHuman?: boolean;
  reason?: string;
  userMessage?: string;
  model?: string;
}

export async function checkAiHealth(): Promise<{ hasApiKey: boolean; models: Record<string, string> }> {
  try {
    const result = await safeApiFetch<{ status: string; hasApiKey: boolean; models: Record<string, string> }>('/api/health');
    if (result.ok && result.data) {
      return {
        hasApiKey: Boolean(result.data.hasApiKey),
        models: result.data.models || {},
      };
    }
    return { hasApiKey: false, models: {} };
  } catch {
    return { hasApiKey: false, models: {} };
  }
}

/**
 * Generate artisan craft descriptions, pricing, and advice using Gemini
 */
export async function sendCraftChat(params: {
  prompt?: string;
  image?: string;
  language?: 'hi' | 'en';
  model?: string;
  apiKey?: string;
  responseMimeType?: string;
  jsonMode?: boolean;
  temperature?: number;
}): Promise<CraftChatResponse> {
  const chosenModel = params.model || 'gemini-3.6-flash';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (params.apiKey) {
    headers['x-gemini-api-key'] = params.apiKey;
  }

  const result = await safeApiFetch<CraftChatResponse>('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: params.prompt,
      image: params.image,
      language: params.language || 'en',
      model: chosenModel,
      responseMimeType: params.responseMimeType,
      jsonMode: params.jsonMode,
      temperature: params.temperature,
    }),
  });

  if (!result.ok || !result.data) {
    return {
      success: false,
      model: chosenModel,
      text: '',
      errorCode: result.errorCode || 'API_REQUEST_FAILED',
      error: result.error || 'Failed to generate response',
    };
  }

  return result.data;
}

/**
 * Validate that an uploaded product image is craft-focused and suitable for publishing.
 * Follows the flow: Image -> Validate -> AI generation -> Publish.
 * Note: A human or artisan in the frame is VALID if the craft itself is identifiable.
 */
export async function validateProductImage(params: {
  image: string;
  language?: 'hi' | 'en';
  apiKey?: string;
}): Promise<ImageValidationResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (params.apiKey) {
    headers['x-gemini-api-key'] = params.apiKey;
  }

  const defaultFailMessage = params.language === 'hi'
    ? 'कृपया एक स्पष्ट उत्पाद-केंद्रित फोटो अपलोड करें।'
    : 'Please upload a clear product-focused image.';

  const result = await safeApiFetch<ImageValidationResult>('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'validate-image',
      image: params.image,
      language: params.language || 'en',
    }),
  });

  if (!result.ok || !result.data) {
    return {
      success: false,
      isValid: false,
      confidence: 0.0,
      productIdentified: null,
      hasHuman: false,
      reason: result.error || 'Product validation service unavailable',
      userMessage: defaultFailMessage,
    };
  }

  return result.data;
}

/**
 * Transcribe recorded audio voice clips using Gemini 3.5 Transcribe
 */
export async function transcribeAudioBlob(
  audioBlob: Blob,
  language: string = 'en',
  apiKey?: string
): Promise<TranscribeResponse> {
  try {
    // Convert Blob to clean base64 and extract mime
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    const cleanMime = (audioBlob.type || 'audio/webm').split(';')[0].trim();
    const cleanBase64 = rawDataUrl.includes(';base64,')
      ? rawDataUrl.split(';base64,')[1].trim()
      : rawDataUrl;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['x-gemini-api-key'] = apiKey;
    }

    const result = await safeApiFetch<TranscribeResponse>('/api/ai/transcribe', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        audioBase64: cleanBase64,
        mimeType: cleanMime,
        language,
      }),
    });

    if (!result.ok || !result.data) {
      return {
        success: false,
        model: 'gemini-3.6-flash',
        text: '',
        errorCode: result.errorCode || 'TRANSCRIBE_FAILED',
        error: result.error || 'Failed to transcribe audio',
      };
    }

    return result.data;
  } catch (err: any) {
    return {
      success: false,
      model: 'gemini-3.6-flash',
      text: '',
      errorCode: 'AUDIO_PROCESSING_ERROR',
      error: err.message || 'Error processing audio recording',
    };
  }
}

/**
 * Generate or enhance studio craft images using Gemini 3.1 Flash Image
 */
export async function generateStudioCraftImage(params: {
  prompt?: string;
  baseImage?: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9';
  apiKey?: string;
}): Promise<ImageGenResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (params.apiKey) {
    headers['x-gemini-api-key'] = params.apiKey;
  }

  const result = await safeApiFetch<ImageGenResponse>('/api/ai/generate-image', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: params.prompt,
      baseImage: params.baseImage,
      aspectRatio: params.aspectRatio || '1:1',
    }),
  });

  if (!result.ok || !result.data) {
    return {
      success: false,
      model: 'gemini-3.1-flash-image',
      errorCode: result.errorCode || 'IMAGE_GEN_FAILED',
      error: result.error || 'Failed to generate studio image',
    };
  }

  return result.data;
}

export interface RemoveBackgroundResponse {
  success: boolean;
  imageUrl?: string;
  publicUrl?: string;
  dataUrl?: string;
  base64?: string;
  storagePath?: string;
  productId?: string;
  imageRecord?: any;
  error?: string;
  errorCode?: string;
  error_code?: string;
}

/**
 * Removes background from an artisan product image using remove.bg HTTP API (transparent PNG output).
 */
export async function removeProductBackground(params: {
  image: string;
  productId?: string;
  authToken?: string;
}): Promise<RemoveBackgroundResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (params.authToken) {
    headers['Authorization'] = `Bearer ${params.authToken}`;
  }

  const result = await safeApiFetch<RemoveBackgroundResponse>('/api/ai/remove-background', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      image: params.image,
      productId: params.productId,
    }),
  });

  if (!result.ok || !result.data) {
    return {
      success: false,
      errorCode: result.errorCode || 'REMOVE_BG_FAILED',
      error: result.error || 'Failed to remove background from image',
    };
  }

  if (!result.data.success) {
    return {
      success: false,
      errorCode: result.data.error_code || 'REMOVE_BG_ERROR',
      error: result.data.error || 'remove.bg could not process this image',
    };
  }

  return result.data;
}

export interface MarketPriceEstimateResponse {
  success: boolean;
  model?: string;
  predicted_price?: number;
  currency?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Predicts prevailing retail market price using the isolated XGBoost model trained on Flipkart Indian E-Commerce data.
 */
export async function fetchMarketPriceEstimate(product: {
  product_name?: string;
  primary_category?: string;
  sub_category?: string;
  brand?: string;
  description?: string;
  spec_count?: number;
  image_count?: number;
  category_depth?: number;
}): Promise<MarketPriceEstimateResponse> {
  const result = await safeApiFetch<MarketPriceEstimateResponse>('/api/pricing/market-estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_name: product.product_name || 'Handcrafted Artisan Product',
      primary_category: product.primary_category || 'Home Decor & Festive Needs',
      sub_category: product.sub_category || 'Table Decor & Handicrafts',
      brand: product.brand || 'Unbranded / Independent',
      description: product.description || '',
      spec_count: product.spec_count ?? 3,
      image_count: product.image_count ?? 2,
      category_depth: product.category_depth ?? 3,
    }),
  });

  if (!result.ok || !result.data) {
    return {
      success: false,
      errorCode: result.errorCode || 'PRICING_ESTIMATE_FAILED',
      error: result.error || 'Failed to estimate market price',
    };
  }

  return result.data;
}

/**
 * Parses spoken voice text into structured artisan costs using Gemini text intelligence
 */
export async function extractCostsFromSpokenText(
  text: string,
  apiKey?: string
): Promise<{
  success: boolean;
  costs?: {
    material_cost: number | null;
    labour_cost: number | null;
    packaging_cost: number | null;
    other_costs: number | null;
  };
  error?: string;
  errorCode?: string;
}> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-gemini-api-key'] = apiKey;

  const result = await safeApiFetch<{
    success: boolean;
    costs?: {
      material_cost: number | null;
      labour_cost: number | null;
      packaging_cost: number | null;
      other_costs: number | null;
    };
    error?: string;
  }>('/api/pricing/extract-costs', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text }),
  });

  if (!result.ok || !result.data) {
    return {
      success: false,
      errorCode: result.errorCode || 'COST_EXTRACTION_FAILED',
      error: result.error || 'Failed to extract costs',
    };
  }

  return result.data;
}

