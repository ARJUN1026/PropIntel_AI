import type { ExtractedCriteria, PropertyDoc, SearchResultDoc } from '../../types.js';
import { MATCH_WEIGHTS } from '../../config/constants.js';

const AMENITY_SYNONYMS: Record<string, string> = {
  gym: 'Gym',
  'fitness center': 'Gym',
  swimming: 'Swimming Pool',
  pool: 'Swimming Pool',
  parking: 'Parking',
  'covered parking': 'Covered Parking',
  lift: 'Lift',
  elevator: 'Lift',
  security: 'Security',
  'power backup': 'Power Backup',
  garden: 'Garden',
  park: 'Garden',
  clubhouse: 'Clubhouse',
  balcony: 'Balcony',
  'play area': 'Children Play Area',
  metro: 'Near Metro',
};

export function normalizeAmenity(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  for (const [syn, canonical] of Object.entries(AMENITY_SYNONYMS)) {
    if (key.includes(syn)) return canonical;
  }
  return null;
}

export function normalizeCity(raw: string): string {
  const map: Record<string, string> = {
    bangalore: 'Bangalore',
    bengaluru: 'Bangalore',
    delhi: 'Delhi NCR',
    'delhi ncr': 'Delhi NCR',
    noida: 'Noida',
    gurgaon: 'Gurgaon',
    gurugram: 'Gurgaon',
    dehradun: 'Dehradun',
    mumbai: 'Mumbai',
    pune: 'Pune',
    hyderabad: 'Hyderabad',
    chandigarh: 'Chandigarh',
  };
  const key = raw.trim().toLowerCase();
  return map[key] ?? raw.trim();
}

/**
 * Parses Indian-style budget expressions into whole rupees.
 * "90 lakh" → 9_000_000; "1.2 crore" → 12_000_000; "₹80L" → 8_000_000.
 */
export function parseBudget(raw: string): number | undefined {
  const text = raw.toLowerCase().replace(/,/g, '');
  const crore = text.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr\b)/);
  if (crore) return Math.round(parseFloat(crore[1]) * 10_000_000);
  const lakh = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/);
  if (lakh) return Math.round(parseFloat(lakh[1]) * 100_000);
  const plain = text.match(/(?:₹|rs\.?\s*)?(\d{5,9})\b/);
  if (plain) return parseInt(plain[1], 10);
  return undefined;
}

const PROPERTY_TYPE_RE = /\b(1|2|3|4)\s*bhk\b/i;
const CITY_RE = new RegExp(
  `\\b(${['bangalore', 'bengaluru', 'dehradun', 'delhi ncr', 'mumbai', 'pune', 'hyderabad', 'chandigarh', 'noida', 'gurgaon', 'gurugram'].join('|')})\\b`,
  'i',
);

/** Tokens that end locality capture while scanning. */
const LOCALITY_STOP = new Set([
  'under', 'below', 'above', 'over', 'with', 'and', 'for', 'near', 'in', 'around', 'at', 'by',
  'to', 'the', 'a', 'an', 'of', 'my', 'me', 'our', 'budget', 'max', 'maximum', 'minimum',
  'from', 'on', 'parking', 'starting', 'budget.', 'please', 'looking', 'want', 'need',
]);
/** City names act as locality boundaries ("in whitefield bangalore" → locality=whitefield). */
const CITY_BOUNDARY = new Set([
  'bangalore', 'bengaluru', 'delhi', 'ncr', 'noida', 'gurgaon', 'gurugram',
  'dehradun', 'mumbai', 'pune', 'hyderabad', 'chandigarh',
]);

/**
 * Extracts locality phrases after prepositions ("in", "near", "around", "at", "close to"),
 * supporting multiple occurrences and multi-word localities ("Rajpur Road"), while
 * skipping the city itself.
 */
export function extractLocalities(lower: string, city?: string): string[] {
  const tokens = lower.replace(/[,.!?;:]/g, ' ').split(/\s+/).filter(Boolean);
  const preps = new Set(['near', 'in', 'around', 'at', 'by']);
  const locations: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!preps.has(tokens[i])) continue;
    if (tokens[i] === 'close' || (tokens[i] === 'near' && tokens[i + 1] === 'to')) {
      if (tokens[i + 1] === 'to') i++;
    }
    const words: string[] = [];
    let j = i + 1;
    while (j < tokens.length && words.length < 3) {
      const t = tokens[j];
      if (LOCALITY_STOP.has(t) || CITY_BOUNDARY.has(t) || /^\d+$/.test(t)) break;
      words.push(t);
      j++;
    }
    const phrase = words.join(' ').trim();
    if (!phrase) continue;
    if (city && (phrase === city.toLowerCase() || city.toLowerCase().includes(phrase))) continue;
    const title = phrase.replace(/\b\w/g, c => c.toUpperCase());
    if (!locations.includes(title)) locations.push(title);
  }
  return locations;
}

/**
 * Deterministic rule-based NLU for intent detection and entity extraction.
 * Works fully offline; the Gemini provider (llm.ts) can substitute for it
 * behind the same ExtractedCriteria contract.
 */
export function extractCriteria(text: string): ExtractedCriteria {
  const lower = text.toLowerCase();

  // ---- intent ----
  let intent: ExtractedCriteria['intent'] = 'INFORMATION';
  if (/\b(compare|comparison|vs\.?|versus)\b/.test(lower)) intent = 'PROPERTY_COMPARISON';
  else if (/\b(site visit|visit the property|book a visit|schedule a visit)\b/.test(lower)) intent = 'SITE_VISIT';
  else if (/\b(rent|rental|lease|tenant)\b/.test(lower)) intent = 'RENT';
  else if (/\b(sell|selling|list my)\b/.test(lower)) intent = 'SELL';
  else if (/\b(invest|investment|roi|appreciation)\b/.test(lower)) intent = 'INVEST';
  else if (/\b(loan|emi|financing|finance|mortgage)\b/.test(lower)) intent = 'FINANCING';
  else if (/\b(price|cost|how much)\b/.test(lower) && !/\b(\d+\s*(?:lakh|crore|cr|l)\b)/.test(lower)) intent = 'PRICE_QUERY';
  else if (/\b(follow up|follow-up|call me back)\b/.test(lower)) intent = 'FOLLOW_UP';
  else if (/\b(buy|purchase|looking for|need|want|show me|search)\b/.test(lower)) intent = 'BUY';

  // ---- property type (BHK + keyword types) ----
  const typeMatch = lower.match(PROPERTY_TYPE_RE);
  let propertyType: ExtractedCriteria['propertyType'] = typeMatch
    ? (`${typeMatch[1]}BHK` as ExtractedCriteria['propertyType'])
    : '';
  if (!propertyType) {
    if (/\bvillas?\b/.test(lower)) propertyType = 'VILLA';
    else if (/\bplots?\b|\bland\b/.test(lower)) propertyType = 'PLOT';
    else if (/\boffices?\b|\bcommercial\b|\bshop\b/.test(lower)) propertyType = 'OFFICE';
  }

  // ---- city ----
  const cityMatch = lower.match(CITY_RE);
  const city = cityMatch ? normalizeCity(cityMatch[1]) : undefined;

  // ---- localities: every "near/in/around/at X" phrase that is not the city ----
  const locations: string[] = extractLocalities(lower, city);

  // ---- budget ----
  let budgetMax: number | undefined;
  let budgetMin: number | undefined;
  const underMatch = lower.match(/\b(?:under|below|upto|up to|less than|max(?:imum)?(?: budget (?:is|of)? )?)\s*([^.,;]+)/);
  if (underMatch) {
    budgetMax = parseBudget(underMatch[1]) ?? parseBudget(lower);
  }
  if (!budgetMax) {
    const around = lower.match(/\b(?:around|about|approx(?:imately)?|budget (?:is|of)?)\s*([^.,;]+)/);
    if (around) budgetMax = parseBudget(around[1]);
  }
  const aboveMatch = lower.match(/\b(?:above|over|more than|minimum)\s*([^.,;]+)/);
  if (aboveMatch) budgetMin = parseBudget(aboveMatch[1]);

  // ---- amenities ----
  const amenities: string[] = [];
  for (const [syn, canonical] of Object.entries(AMENITY_SYNONYMS)) {
    if (new RegExp(`\\b${syn}\\b`).test(lower) && !amenities.includes(canonical)) {
      amenities.push(canonical);
    }
  }

  // ---- parking / furnishing ----
  const parking = /\b(parking|garage|car park)\b/.test(lower) ? true : undefined;
  const furnishing = /\bfurnished\b/.test(lower)
    ? /\bfully\s+furnished\b/.test(lower)
      ? ('FULLY_FURNISHED' as const)
      : /\bsemi\s*furnished\b/.test(lower)
        ? ('SEMI_FURNISHED' as const)
        : ('FULLY_FURNISHED' as const)
    : undefined;

  const signals = [propertyType, city, budgetMax, locations.length, amenities.length, parking].filter(Boolean).length;
  const confidence = Math.min(1, 0.3 + signals * 0.14);

  // Verb-less shopping queries (e.g. "3BHK in Bangalore under 1.2 crore near Whitefield")
  // carry concrete criteria — treat them as purchase intent per spec §8's example output.
  if (intent === 'INFORMATION' && (propertyType || budgetMax || budgetMin || city)) {
    intent = 'BUY';
  }

  return {
    intent,
    propertyType,
    locations,
    city,
    budgetMin,
    budgetMax,
    amenities,
    parking,
    furnishing,
    confidence,
  };
}

export function detectIntent(text: string): ExtractedCriteria['intent'] {
  return extractCriteria(text).intent;
}

/**
 * Weighted match scoring per spec §11.1. Deterministic and explainable.
 */
export function scoreProperty(criteria: ExtractedCriteria, property: PropertyDoc): { score: number; reasons: string[] } {
  let total = 0;
  const reasons: string[] = [];

  // budget — 25
  let budgetScore = 12.5; // neutral when unknown
  if (criteria.budgetMax !== undefined) {
    budgetScore = property.price <= criteria.budgetMax ? MATCH_WEIGHTS.budget : Math.max(0, MATCH_WEIGHTS.budget - Math.min(20, ((property.price - criteria.budgetMax) / criteria.budgetMax) * 100));
  } else if (criteria.budgetMin !== undefined) {
    budgetScore = property.price >= criteria.budgetMin ? MATCH_WEIGHTS.budget : MATCH_WEIGHTS.budget / 2;
  } else {
    budgetScore = MATCH_WEIGHTS.budget * 0.6;
  }
  total += budgetScore;
  if (criteria.budgetMax !== undefined && property.price <= criteria.budgetMax) {
    reasons.push('Within your budget');
  }

  // location — 25
  let locationScore = MATCH_WEIGHTS.location * 0.5;
  if (criteria.locations.length > 0) {
    const localityHit = criteria.locations.some(l => property.locality.toLowerCase().includes(l.toLowerCase()) || l.toLowerCase().includes(property.locality.toLowerCase()));
    if (localityHit) {
      locationScore = MATCH_WEIGHTS.location;
      reasons.push(`Located in ${property.locality}`);
    } else if (criteria.city && property.city.toLowerCase() === criteria.city.toLowerCase()) {
      locationScore = MATCH_WEIGHTS.location * 0.7;
      reasons.push(`In your preferred city ${property.city}`);
    }
  } else if (criteria.city && property.city.toLowerCase() === criteria.city.toLowerCase()) {
    locationScore = MATCH_WEIGHTS.location * 0.8;
    reasons.push(`In ${property.city}`);
  }
  total += locationScore;

  // property type — 20
  let typeScore = MATCH_WEIGHTS.propertyType * 0.5;
  if (criteria.propertyType) {
    typeScore = property.propertyType === criteria.propertyType ? MATCH_WEIGHTS.propertyType : 0;
    if (typeScore > 0) reasons.push(`Matches your requested ${criteria.propertyType} configuration`);
  } else if (criteria.bedrooms) {
    typeScore = property.bedrooms === criteria.bedrooms ? MATCH_WEIGHTS.propertyType : MATCH_WEIGHTS.propertyType * 0.4;
  }
  total += typeScore;

  // amenities — 15
  if (criteria.amenities.length > 0) {
    const matched = criteria.amenities.filter(a => property.amenities.some(pa => pa.toLowerCase() === a.toLowerCase()));
    const partial = criteria.amenities.filter(a => property.amenities.some(pa => pa.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(pa.toLowerCase())));
    const covered = new Set([...matched, ...partial]);
    const ratio = covered.size / criteria.amenities.length;
    total += MATCH_WEIGHTS.amenities * ratio;
    if (ratio >= 0.99) reasons.push(`Has all requested amenities (${criteria.amenities.join(', ')})`);
    else if (ratio > 0) reasons.push(`Includes ${[...covered].join(', ')}`);
  } else {
    total += MATCH_WEIGHTS.amenities * 0.6;
  }

  // parking — folded into amenities bonus, and size — 15
  let sizeScore = MATCH_WEIGHTS.size * 0.5;
  if (criteria.parking !== undefined) {
    if (property.parking === criteria.parking) {
      sizeScore = MATCH_WEIGHTS.size * 0.7;
      if (criteria.parking) reasons.push('Parking available');
    }
  } else {
    sizeScore = MATCH_WEIGHTS.size * 0.6;
  }
  if (property.carpetArea > 0) sizeScore += MATCH_WEIGHTS.size * 0.3;
  total += sizeScore;

  // ---- hard mismatch penalties (keep wrong-category results out of top ranks) ----
  const penalties: number[] = [];
  if (criteria.propertyType && property.propertyType !== criteria.propertyType) {
    penalties.push(0.7); // asked for a villa, showing an office
  }
  if (criteria.intent === 'RENT' && property.listingType !== 'RENT') {
    penalties.push(0.45); // rental intent must not surface for-sale inventory
  }
  if (criteria.intent === 'BUY' && property.listingType === 'RENT') {
    penalties.push(0.45);
  }
  if (
    criteria.city &&
    !property.city.toLowerCase().includes(criteria.city.toLowerCase()) &&
    !criteria.locations.some(l => property.locality.toLowerCase().includes(l.toLowerCase()))
  ) {
    penalties.push(0.8); // wrong city and none of the requested localities
  }
  const penalty = penalties.reduce((acc, p) => acc * p, 1);

  const score = Math.max(0, Math.min(100, Math.round(total * penalty)));
  return { score, reasons: reasons.slice(0, 5) };
}

export function rankProperties(
  criteria: ExtractedCriteria,
  properties: PropertyDoc[],
  limit = 12,
  minScore = 0,
): SearchResultDoc[] {
  return properties
    .map(property => {
      const { score, reasons } = scoreProperty(criteria, property);
      return { property, matchScore: score, reasons };
    })
    .filter(r => r.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
