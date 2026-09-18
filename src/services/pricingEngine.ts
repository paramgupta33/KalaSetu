/**
 * pricingEngine.ts - Artisan-Centric Fair Pricing Engine
 * 
 * Combines:
 * 1. Artisan Production Costs (Material, Labour, Packaging, Other)
 * 2. Configurable Minimum Margin Requirement
 * 3. XGBoost Market-Based E-Commerce Price Prediction
 * 
 * Rules:
 * - Does NOT assume unknown costs are 0. Unknown costs are strictly null.
 * - Does NOT hardcode a permanent profit margin.
 * - Warns when market estimate is below minimum viable price.
 * - Indicates incomplete cost information clearly.
 */

export interface ArtisanCostInputs {
  material_cost: number | null;
  labour_cost: number | null; // Total craftsmanship/effort valuation (not hourly)
  packaging_cost: number | null;
  other_costs: number | null; // Studio, kiln, transport, tools, etc.
}

export type CostFieldKey = keyof ArtisanCostInputs;

export interface PricingEvaluationResult {
  // Artisan Costs
  material_cost: number | null;
  labour_cost: number | null;
  packaging_cost: number | null;
  other_costs: number | null;

  // Completeness & Intermediate Sums
  isCostComplete: boolean;
  missingCostKeys: CostFieldKey[];
  knownCostSubtotal: number;
  knownCostCount: number;
  total_production_cost: number | null; // null if any cost field is unknown

  // Minimum Viable Price
  margin_percent: number;
  minimum_viable_price: number | null;
  target_profit_amount: number | null;

  // Market Baseline (XGBoost)
  market_predicted_price: number | null;
  market_price_difference: number | null; // market_predicted_price - minimum_viable_price

  // Final Recommendation & Warning
  recommended_price: number | null;
  warning_type: 'none' | 'below_viable_cost' | 'incomplete_costs' | 'incomplete_costs_with_market' | 'no_data';
  warning: string | null;
  warning_hi: string | null;
  status_title: string;
  status_title_hi: string;
}

/**
 * Calculates fair pricing by combining production costs, margin, and market estimate.
 */
export function calculateArtisanPricing(
  costs: ArtisanCostInputs,
  marginPercent: number = 25,
  marketPredictedPrice: number | null = null
): PricingEvaluationResult {
  const { material_cost, labour_cost, packaging_cost, other_costs } = costs;

  const costEntries: [CostFieldKey, number | null][] = [
    ['material_cost', material_cost],
    ['labour_cost', labour_cost],
    ['packaging_cost', packaging_cost],
    ['other_costs', other_costs],
  ];

  const missingCostKeys: CostFieldKey[] = costEntries
    .filter(([_, val]) => val === null || val === undefined || isNaN(val))
    .map(([key]) => key);

  const isCostComplete = missingCostKeys.length === 0;

  let knownCostSubtotal = 0;
  let knownCostCount = 0;
  costEntries.forEach(([_, val]) => {
    if (typeof val === 'number' && !isNaN(val) && val >= 0) {
      knownCostSubtotal += val;
      knownCostCount++;
    }
  });

  // total_production_cost is strictly null if any cost component is unknown
  const total_production_cost: number | null = isCostComplete
    ? (material_cost! + labour_cost! + packaging_cost! + other_costs!)
    : null;

  // Minimum viable price calculation: total_production_cost / (1 - margin_percent / 100)
  const clampedMargin = Math.max(0, Math.min(95, marginPercent));
  let minimum_viable_price: number | null = null;
  let target_profit_amount: number | null = null;

  if (total_production_cost !== null) {
    const divisor = Math.max(0.05, 1 - clampedMargin / 100);
    minimum_viable_price = Math.round(total_production_cost / divisor);
    target_profit_amount = minimum_viable_price - total_production_cost;
  }

  // Market Price Comparison
  let market_price_difference: number | null = null;
  if (marketPredictedPrice !== null && minimum_viable_price !== null) {
    market_price_difference = Math.round(marketPredictedPrice - minimum_viable_price);
  }

  // Recommendation & Warning Logic
  let recommended_price: number | null = null;
  let warning_type: PricingEvaluationResult['warning_type'] = 'none';
  let warning: string | null = null;
  let warning_hi: string | null = null;
  let status_title = 'Fair Price Ready';
  let status_title_hi = 'उचित मूल्य तैयार';

  if (isCostComplete && minimum_viable_price !== null) {
    if (marketPredictedPrice !== null) {
      if (marketPredictedPrice < minimum_viable_price) {
        // Warning: Market is below viable price!
        warning_type = 'below_viable_cost';
        const deficit = minimum_viable_price - marketPredictedPrice;
        status_title = 'Market Alert: Below Viable Cost';
        status_title_hi = 'बाजार चेतावनी: लागत से कम मूल्य';
        warning = `Prevailing marketplace estimate (₹${marketPredictedPrice.toLocaleString()}) is ₹${deficit.toLocaleString()} lower than your Minimum Viable Price (₹${minimum_viable_price.toLocaleString()}). Selling at market baseline will fail to cover your ₹${total_production_cost.toLocaleString()} costs and ${clampedMargin}% margin. Recommended: ₹${minimum_viable_price.toLocaleString()}.`;
        warning_hi = `बाजार का औसत मूल्य (₹${marketPredictedPrice.toLocaleString()}) आपके न्यूनतम व्यवहार्य मूल्य (₹${minimum_viable_price.toLocaleString()}) से ₹${deficit.toLocaleString()} कम है। बाजार दर पर बेचने से ₹${total_production_cost.toLocaleString()} की उत्पादन लागत व ${clampedMargin}% मुनाफा सुरक्षित नहीं रहेगा। सुझाई गई सुरक्षित कीमत: ₹${minimum_viable_price.toLocaleString()}।`;
        recommended_price = minimum_viable_price;
      } else {
        // Market price is favorable
        warning_type = 'none';
        status_title = 'Healthy Margin Achieved';
        status_title_hi = 'उत्कृष्ट लाभ स्तर';
        // When market is higher than minimum viable price, artisan earns competitive surplus
        recommended_price = Math.round(marketPredictedPrice);
      }
    } else {
      // Cost complete, no market price
      warning_type = 'none';
      recommended_price = minimum_viable_price;
      status_title = 'Cost-Plus Viable Price';
      status_title_hi = 'लागत आधारित व्यवहार्य मूल्य';
    }
  } else {
    // Incomplete cost information
    if (marketPredictedPrice !== null) {
      warning_type = 'incomplete_costs_with_market';
      status_title = 'Market Baseline (Cost Data Incomplete)';
      status_title_hi = 'बाजार अनुमान (लागत अधूरी है)';
      const missingLabels = missingCostKeys.map((k) => getCostFieldLabel(k, 'en')).join(', ');
      const missingLabelsHi = missingCostKeys.map((k) => getCostFieldLabel(k, 'hi')).join(', ');
      warning = `Your cost breakdown is incomplete (${missingLabels} marked unknown). The XGBoost market estimate (₹${marketPredictedPrice.toLocaleString()}) is displayed as an external baseline, but your minimum viable cost coverage cannot be verified without complete costs.`;
      warning_hi = `आपकी लागत का विवरण अधूरा है (${missingLabelsHi} अज्ञात हैं)। ई-कॉमर्स बाजार अनुमान (₹${marketPredictedPrice.toLocaleString()}) संदर्भ के लिए दिखाया गया है, पर जब तक सभी लागतें दर्ज नहीं होतीं, न्यूनतम सुरक्षा मूल्य सत्यापित नहीं किया जा सकता।`;
      recommended_price = Math.round(marketPredictedPrice);
    } else {
      warning_type = knownCostCount > 0 ? 'incomplete_costs' : 'no_data';
      status_title = 'Cost Details Needed';
      status_title_hi = 'लागत विवरण आवश्यक';
      warning = 'Please enter your craft costs or provide product information to compute a fair pricing recommendation.';
      warning_hi = 'कृपया उचित मूल्य गणना के लिए अपनी सामग्री, श्रम या उत्पाद विवरण दर्ज करें।';
      recommended_price = null;
    }
  }

  return {
    material_cost,
    labour_cost,
    packaging_cost,
    other_costs,
    isCostComplete,
    missingCostKeys,
    knownCostSubtotal,
    knownCostCount,
    total_production_cost,
    margin_percent: clampedMargin,
    minimum_viable_price,
    target_profit_amount,
    market_predicted_price: marketPredictedPrice !== null ? Math.round(marketPredictedPrice) : null,
    market_price_difference,
    recommended_price,
    warning_type,
    warning,
    warning_hi,
    status_title,
    status_title_hi,
  };
}

export function getCostFieldLabel(field: CostFieldKey, lang: 'en' | 'hi' = 'en'): string {
  switch (field) {
    case 'material_cost':
      return lang === 'hi' ? 'सामग्री लागत' : 'Material Cost';
    case 'labour_cost':
      return lang === 'hi' ? 'आपका श्रम मूल्य' : 'Your Labour Cost';
    case 'packaging_cost':
      return lang === 'hi' ? 'पैकेजिंग लागत' : 'Packaging Cost';
    case 'other_costs':
      return lang === 'hi' ? 'अन्य खर्च' : 'Other Costs';
  }
}

/**
 * Parses spoken or written text into structured artisan costs.
 * Supports English, Hindi, and Hinglish phrases.
 * Example: "Material cost is 300 rupees and packaging is 50" -> { material_cost: 300, packaging_cost: 50, ... }
 */
export function parseSpokenCosts(text: string): Partial<ArtisanCostInputs> {
  if (!text || typeof text !== 'string') return {};

  const clean = text.toLowerCase().replace(/,/g, '');
  const extracted: Partial<ArtisanCostInputs> = {};

  // Helper to extract numbers following or preceding keywords
  const extractCostForKeywords = (keywords: string[]): number | null => {
    for (const kw of keywords) {
      // Pattern 1: keyword ... [is / of / :] ... [₹/rs/rupees] ... NUMBER
      const regAfter = new RegExp(
        `${kw}[^0-9₹rs]{0,25}?(?:is|of|:|cost[s]?|rate|ka|ki|ke|hai|tha)?\\s*(?:₹|rs\\.?|rupees?|रुपये|रुपए)?\\s*([0-9]+(?:\\.[0-9]+)?)`,
        'i'
      );
      const matchAfter = clean.match(regAfter);
      if (matchAfter && matchAfter[1]) {
        const val = parseFloat(matchAfter[1]);
        if (!isNaN(val) && val >= 0) return val;
      }

      // Pattern 2: NUMBER [₹/rs/rupees] ... keyword
      const regBefore = new RegExp(
        `([0-9]+(?:\\.[0-9]+)?)\\s*(?:₹|rs\\.?|rupees?|रुपये|रुपए)?\\s*(?:for|ki|ka|wali|mein)?\\s*${kw}`,
        'i'
      );
      const matchBefore = clean.match(regBefore);
      if (matchBefore && matchBefore[1]) {
        const val = parseFloat(matchBefore[1]);
        if (!isNaN(val) && val >= 0) return val;
      }
    }
    return null;
  };

  // 1. Material Cost Keywords
  const matVal = extractCostForKeywords([
    'material cost',
    'material',
    'raw material',
    'raw',
    'clay',
    'brass',
    'silk',
    'quartz',
    'सामग्री',
    'कच्चा माल',
    'धातु',
    'मिट्टी'
  ]);
  if (matVal !== null) extracted.material_cost = matVal;

  // 2. Labour Cost Keywords (Your effort/craftsmanship value)
  const labVal = extractCostForKeywords([
    'labour cost',
    'labor cost',
    'labour',
    'labor',
    'artisan cost',
    'my effort',
    'crafting effort',
    'work cost',
    'wage',
    'श्रम',
    'कारीगरी',
    'मेहनत',
    'मजदूरी'
  ]);
  if (labVal !== null) extracted.labour_cost = labVal;

  // 3. Packaging Cost Keywords
  const packVal = extractCostForKeywords([
    'packaging cost',
    'packaging',
    'package',
    'box',
    'packing',
    'पैकेजिंग',
    'डिब्बा',
    'पैकिंग'
  ]);
  if (packVal !== null) extracted.packaging_cost = packVal;

  // 4. Other Costs Keywords
  const otherVal = extractCostForKeywords([
    'other cost',
    'other costs',
    'other',
    'kiln',
    'firing',
    'electricity',
    'transport',
    'workshop',
    'अन्य',
    'भट्टी',
    'खर्च',
    'परिवहन'
  ]);
  if (otherVal !== null) extracted.other_costs = otherVal;

  return extracted;
}
