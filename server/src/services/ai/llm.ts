import type { ExtractedCriteria } from '../../types.js';
import { config } from '../../config/env.js';
import { extractCriteria } from './nlu.js';

export interface LlmProvider {
  /** Produce structured extraction for a free-text property requirement. */
  extract(text: string): Promise<ExtractedCriteria>;
  /** Generate a short natural-language reply. Returns null when unavailable. */
  generate(prompt: string, context: string): Promise<string | null>;
}

/**
 * Mock provider: deterministic and fully offline. Uses the rule-based NLU so
 * the entire product works without API keys, and template text for generation.
 */
export class MockProvider implements LlmProvider {
  async extract(text: string): Promise<ExtractedCriteria> {
    return extractCriteria(text);
  }

  async generate(prompt: string, _context: string): Promise<string | null> {
    if (prompt.includes('FOLLOW_UP')) {
      return 'Hi! I wanted to follow up regarding the properties we discussed. I found a few new options that match your preferred budget — would you like me to share the details?';
    }
    if (prompt.includes('DESCRIBE')) {
      return 'A well-designed home with thoughtfully planned spaces, modern amenities and a convenient location — ideal for families seeking comfort and connectivity.';
    }
    return null;
  }
}

/**
 * Gemini provider (optional). Activated with AI_PROVIDER=gemini + AI_API_KEY.
 * Uses the REST API directly to avoid adding a hard SDK dependency.
 */
export class GeminiProvider implements LlmProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extract(text: string): Promise<ExtractedCriteria> {
    const system = [
      'Extract structured real-estate search criteria from the user message.',
      'Respond ONLY with JSON with keys: intent (one of BUY,RENT,SELL,INVEST,INFORMATION,PRICE_QUERY,SITE_VISIT,FINANCING,PROPERTY_COMPARISON,FOLLOW_UP),',
      'propertyType ("1BHK"|"2BHK"|"3BHK"|"4BHK"|"PLOT"|"VILLA"|"OFFICE"|""), locations (array of locality strings), city,',
      'budgetMin, budgetMax (numbers in rupees; interpret lakh=100000, crore=10000000), amenities (array), parking (boolean or null),',
      'furnishing ("UNFURNISHED"|"SEMI_FURNISHED"|"FULLY_FURNISHED"|null), confidence (0-1).',
    ].join(' ');
    const raw = await this.call(`${system}\n\nUser message: ${text}`);
    try {
      const json = JSON.parse(raw.replace(/```json|```/g, '').trim()) as ExtractedCriteria;
      return json;
    } catch {
      // fall back to rule-based extraction on any parse failure
      return extractCriteria(text);
    }
  }

  async generate(prompt: string, context: string): Promise<string | null> {
    try {
      return await this.call(`${context}\n\n${prompt}`);
    } catch {
      return null;
    }
  }

  private async call(contents: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: contents }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
    });
    if (!res.ok) {
      throw new Error(`Gemini API error ${res.status}`);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
    if (!text) throw new Error('Gemini returned empty response');
    return text;
  }
}

export function getLlmProvider(): LlmProvider {
  const { provider, apiKey, model } = config.ai;
  if (provider === 'gemini' && apiKey) {
    return new GeminiProvider(apiKey, model);
  }
  return new MockProvider();
}
