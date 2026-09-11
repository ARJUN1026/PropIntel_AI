import { Lead } from '../../models/Lead.js';
import { Activity } from '../../models/Activity.js';
import type { LeadDoc } from '../../types.js';
import { LEAD_SCORE_WEIGHTS, LEAD_TEMPERATURE_BANDS } from '../../config/constants.js';

/**
 * Deterministic lead scoring per spec §23 rubric.
 * budget 20 / location 15 / type 15 / timeline 20 / site visit 20 / engagement 10
 */
export function computeLeadScore(lead: {
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredLocations: string[];
  propertyType?: string | null;
  timeline?: string | null;
  status: string;
  engagementCount: number;
}): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (lead.budgetMin != null || lead.budgetMax != null) {
    score += LEAD_SCORE_WEIGHTS.budgetConfirmed;
    reasons.push('Budget confirmed');
  }
  if (lead.preferredLocations.length > 0) {
    score += LEAD_SCORE_WEIGHTS.locationConfirmed;
    reasons.push('Preferred location confirmed');
  }
  if (lead.propertyType) {
    score += LEAD_SCORE_WEIGHTS.propertyTypeConfirmed;
    reasons.push('Requested property details');
  }

  if (lead.timeline != null && lead.timeline !== '') {
    score += LEAD_SCORE_WEIGHTS.timelineConfirmed;
    reasons.push(`Purchase timeline: ${lead.timeline}`);
  }
  if (lead.status === 'SITE_VISIT' || lead.status === 'NEGOTIATION' || lead.status === 'CONVERTED') {
    score += LEAD_SCORE_WEIGHTS.siteVisitRequested;
    reasons.push('Requested site visit');
  }

  // engagement 0-10 based on tracked interactions
  const engagement = Math.min(LEAD_SCORE_WEIGHTS.engagement, lead.engagementCount * 2);
  score += engagement;
  if (engagement >= LEAD_SCORE_WEIGHTS.engagement) {
    reasons.push('High engagement');
  }

  return { score: Math.min(100, score), reasons };
}

export function temperatureFor(score: number): LeadDoc['leadTemperature'] {
  if (score >= LEAD_TEMPERATURE_BANDS.HOT[0]) return 'HOT';
  if (score >= LEAD_TEMPERATURE_BANDS.WARM[0]) return 'WARM';
  if (score >= LEAD_TEMPERATURE_BANDS.NURTURE[0]) return 'NURTURE';
  return 'COLD';
}

/** Recommended next action per spec §34. */
export function recommendedNextAction(lead: {
  status: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredLocations: string[];
  propertyType?: string | null;
  leadScore: number;
}): { action: string; reason: string } {
  if (lead.leadScore >= 80) return { action: 'SCHEDULE_SITE_VISIT', reason: 'Customer has confirmed budget, location and property details.' };
  if (lead.status === 'NEW') {
    return lead.preferredLocations.length > 0 && (lead.budgetMin != null || lead.budgetMax != null)
      ? { action: 'SEND_PROPERTY_OPTIONS', reason: 'Requirement is clear; share matching properties.' }
      : lead.preferredLocations.length === 0
        ? { action: 'REQUEST_LOCATION', reason: 'Location preference is missing.' }
        : { action: 'REQUEST_BUDGET', reason: 'Budget is missing.' };
  }
  if (lead.status === 'QUALIFIED' || lead.status === 'CONTACTED') return { action: 'FOLLOW_UP', reason: 'Keep the conversation moving.' };
  if (lead.status === 'FOLLOW_UP') return { action: 'FOLLOW_UP', reason: 'Follow-up pending with the customer.' };
  if (lead.status === 'NURTURE') return { action: 'MOVE_TO_NURTURE', reason: 'Not ready to transact yet; nurture over time.' };
  return { action: 'CALL_CUSTOMER', reason: 'Re-engage the customer.' };
}

/** Recomputes score + temperature and persists. Returns updated doc. */
export async function rescoreLead(leadId: string) {
  const lead = await Lead.findById(leadId);
  if (!lead) return null;
  const { score, reasons } = computeLeadScore(lead);
  lead.leadScore = score;
  lead.leadTemperature = temperatureFor(score);
  await lead.save();
  await Activity.create({
    type: 'LEAD_SCORED',
    leadId: lead._id,
    customerId: lead.customerId,
    description: `Lead scored ${score}/100 (${lead.leadTemperature})`,
    metadata: { reasons },
  });
  return lead;
}
