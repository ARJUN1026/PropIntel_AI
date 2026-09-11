import { Lead } from '../../models/Lead.js';
import { Conversation } from '../../models/Conversation.js';
import { Activity } from '../../models/Activity.js';
import { rescoreLead } from '../lead/leadScoring.js';
import type { ExtractedCriteria } from '../../types.js';

/**
 * AI lead capture (spec §21): creates or updates a lead from extracted
 * conversation requirements, then re-scores it. Idempotent per conversation.
 */
export async function captureLeadFromCriteria(params: {
  customerId: string;
  customerName: string;
  phone?: string;
  conversationId?: string;
  criteria: ExtractedCriteria;
  source?: string;
}) {
  const { customerId, customerName, conversationId, criteria } = params;

  const existing = conversationId
    ? await Lead.findOne({ customerId, _id: (await Conversation.findById(conversationId))?.leadId })
    : null;

  let lead = existing;
  if (!lead) {
    lead = await Lead.findOne({ customerId, status: { $in: ['NEW', 'CONTACTED', 'QUALIFIED'] } });
  }

  const requirements: string[] = [...criteria.amenities];
  if (criteria.parking) requirements.push('Parking');

  if (!lead) {
    lead = new Lead({
      customerId,
      name: customerName,
      phone: params.phone,
      source: (params.source as never) ?? 'WEBSITE',
      intent: criteria.intent,
      propertyType: criteria.propertyType || undefined,
      preferredLocations: criteria.locations.length > 0 ? criteria.locations : criteria.city ? [criteria.city] : [],
      budgetMin: criteria.budgetMin,
      budgetMax: criteria.budgetMax,
      timeline: undefined,
      requirements,
      status: 'NEW',
      engagementCount: 1,
    });
    await lead.save();
    await Activity.create({
      type: 'LEAD_CREATED',
      customerId,
      leadId: lead._id,
      description: `Lead captured from AI assistant (${criteria.intent})`,
    });
  } else {
    // merge extracted info into the lead (spec §13: reuse conversation state)
    if (criteria.propertyType) lead.propertyType = criteria.propertyType;
    for (const loc of criteria.locations) {
      if (!lead.preferredLocations.includes(loc)) lead.preferredLocations.push(loc);
    }
    if (criteria.city && lead.preferredLocations.length === 0) lead.preferredLocations.push(criteria.city);
    if (criteria.budgetMax !== undefined) lead.budgetMax = criteria.budgetMax;
    if (criteria.budgetMin !== undefined) lead.budgetMin = criteria.budgetMin;
    for (const req of requirements) {
      if (!lead.requirements.includes(req)) lead.requirements.push(req);
    }
    lead.engagementCount += 1;
    await lead.save();
  }

  if (conversationId) {
    await Conversation.findByIdAndUpdate(conversationId, { leadId: lead._id });
  }

  await rescoreLead(String(lead._id));
  const updated = await Lead.findById(lead._id);
  return updated;
}
