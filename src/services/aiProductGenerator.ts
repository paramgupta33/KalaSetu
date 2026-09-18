import { sendCraftChat } from './aiService';

export interface GeneratedProductDetails {
  title: string;
  category: string;
  categoryLabel: string;
  subCategory: string;
  materials: string[];
  specifications: string[];
  dimensions: string;
  tags: string[];
  description: string;
  qualityCheck: {
    passed: boolean;
    message: string;
  };
}

/**
 * Clean and parse JSON response from Gemini
 */
function extractJsonFromText(rawText: string): any {
  if (!rawText) return null;
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  // Find first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Could not parse JSON from model response:', rawText, err);
    return null;
  }
}

/**
 * Generate comprehensive e-commerce product details from photo and description using Gemini
 */
export async function generateProductDetailsWithAi(params: {
  image?: string | null;
  description: string;
  language?: string;
  identifiedProduct?: string | null;
  craftCategory?: string | null;
}): Promise<GeneratedProductDetails> {
  const { image, description, language = 'en', identifiedProduct, craftCategory } = params;

  const prompt = `You are KalaAI, an expert Indian heritage craft cataloger and mentor for authentic Indian artisans.
Based on the provided craft photo, identified craft (${identifiedProduct || 'craft'}), and/or the artisan's description:
"${description}"

Analyze the craft tradition, materials, and features, and generate complete e-commerce product details.
CRITICAL AUTHENTICITY & VALIDATION RULES:
- The craft/product MUST be identifiable. If the image does not contain an identifiable craft/product, set "qualityCheck": { "passed": false, "message": "Please upload a clear product-focused image." }.
- Do not fabricate GI certification, materials, dimensions, heritage claims, manufacturing duration, or authenticity claims unless provided by the artisan or clearly supported by the image/description.
- Only include materials and dimensions that are stated by the artisan or clearly identifiable from the image.
- If a material or dimension cannot be determined reliably, use an empty string or empty array instead of guessing.
- Never invent product facts just to fill a field.

Return ONLY a valid JSON object matching this schema:
{
  "title": "Clear, appealing craft title (e.g. Handcrafted Jaipur Blue Pottery Floral Urli)",
  "category": "One of: pottery, handloom, brass, wood, paintings, jewelry, decor, gifts",
  "categoryLabel": "Traditional Craft Name (e.g. Jaipur Blue Pottery, Varanasi Zari Handloom, Dhokra Bell Metal)",
  "subCategory": "Sub-category (e.g. Table Decor & Bowls, Sarees & Stoles, Figurines)",
  "materials": ["Primary Material 1", "Material 2"],
  "specifications": ["Spec 1", "Spec 2"],
  "dimensions": "Stated dimensions only, or empty string if not provided",
  "tags": ["relevant", "search", "tags"],
  "description": "Engaging, authentic craft story and product description highlighting handcrafted techniques and care instructions.",
  "qualityCheck": {
    "passed": true,
    "message": "Human-friendly check result"
  }
}

Respond in ${language === 'hi' ? 'Hindi (Devanagari script)' : 'English'}.

Return ONLY valid JSON.
Do not use Markdown.
Do not use \`\`\`json fences.
Do not add any explanation before or after the JSON.
All string values must be properly JSON-escaped.
If information is unavailable, use "" for strings and [] for arrays.`;

  const response = await sendCraftChat({
    prompt,
    image: image || undefined,
    language: language === 'hi' ? 'hi' : 'en',
    model: 'gemini-3.6-flash',
    responseMimeType: 'application/json',
    jsonMode: true,
    temperature: 0.2,
  });

  const defaultErrorMessage = language === 'hi'
    ? 'कृपया एक स्पष्ट उत्पाद-केंद्रित फोटो अपलोड करें।'
    : 'Please upload a clear product-focused image.';

  if (!response.success) {
    throw new Error(defaultErrorMessage);
  }
  console.log("[AI Product] Raw Gemini response:", response.text);

  const parsed = extractJsonFromText(response.text);
  if (!parsed || !parsed.title || parsed.qualityCheck?.passed === false) {
    const errorMsg = parsed?.qualityCheck?.message || defaultErrorMessage;
    throw new Error(errorMsg);
  }

  return {
    title: String(parsed.title || '').trim(),
    category: String(parsed.category || craftCategory || 'pottery').trim().toLowerCase(),
    categoryLabel: String(parsed.categoryLabel || 'Handmade Craft').trim(),
    subCategory: String(parsed.subCategory || 'Handicrafts & Decor').trim(),
    materials: Array.isArray(parsed.materials) ? parsed.materials.map(String) : [],
    specifications: Array.isArray(parsed.specifications) ? parsed.specifications.map(String) : [],
    dimensions: String(parsed.dimensions || '').trim(),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : ['handcrafted', 'artisan'],
    description: String(parsed.description || description).trim(),
    qualityCheck: {
      passed: parsed.qualityCheck?.passed ?? true,
      message: parsed.qualityCheck?.message || 'Details generated from artisan craft image.',
    },
  };
}

/**
 * Talk to AI: Refine or update current product details based on artisan's natural instruction
 */
export async function refineProductWithAi(params: {
  currentDetails: GeneratedProductDetails;
  userInstruction: string;
  language?: string;
}): Promise<GeneratedProductDetails> {
  const { currentDetails, userInstruction, language = 'en' } = params;

  const prompt = `You are KalaAI, assisting an artisan in refining their product listing.
CURRENT PRODUCT DETAILS:
${JSON.stringify(currentDetails, null, 2)}

ARTISAN REQUEST:
"${userInstruction}"

Please update ONLY what the artisan requested (e.g. shortening the title, changing tone, adding specific details, adjusting materials, or refining description).
Do not replace or alter other fields that the artisan did not ask to change.
Return the updated details as a JSON object with the exact same fields:
{
  "title": "...",
  "category": "...",
  "categoryLabel": "...",
  "subCategory": "...",
  "materials": ["..."],
  "specifications": ["..."],
  "dimensions": "...",
  "tags": ["..."],
  "description": "...",
  "qualityCheck": {
    "passed": true,
    "message": "..."
  }
}
Respond in ${language === 'hi' ? 'Hindi' : 'English'}.
Return ONLY the raw JSON object.`;

  const response = await sendCraftChat({
    prompt,
    language: language === 'hi' ? 'hi' : 'en',
    model: 'gemini-3.6-flash',
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to refine product details with AI.');
  }

  const parsed = extractJsonFromText(response.text);
  if (!parsed || !parsed.title) {
    throw new Error('AI returned an invalid response format while updating details.');
  }

  return {
    title: String(parsed.title || currentDetails.title).trim(),
    category: String(parsed.category || currentDetails.category).trim().toLowerCase(),
    categoryLabel: String(parsed.categoryLabel || currentDetails.categoryLabel).trim(),
    subCategory: String(parsed.subCategory || currentDetails.subCategory).trim(),
    materials: Array.isArray(parsed.materials) ? parsed.materials.map(String) : currentDetails.materials,
    specifications: Array.isArray(parsed.specifications) ? parsed.specifications.map(String) : currentDetails.specifications,
    dimensions: String(parsed.dimensions || currentDetails.dimensions).trim(),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : currentDetails.tags,
    description: String(parsed.description || currentDetails.description).trim(),
    qualityCheck: {
      passed: parsed.qualityCheck?.passed ?? true,
      message: parsed.qualityCheck?.message || 'Updated according to your instructions.',
    },
  };
}
