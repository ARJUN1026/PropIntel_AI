import type { Request, Response, NextFunction } from 'express';
import { Lead } from '../models/Lead.js';
import { Activity } from '../models/Activity.js';
import { rescoreLead, computeLeadScore, temperatureFor, recommendedNextAction } from '../services/lead/leadScoring.js';
import { ApiError } from '../middleware/error.js';
/** GET /api/leads — role-scoped list with filters (spec §52 lead filters) */
export async function listLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (req.user!.role === 'CUSTOMER') filter.customerId = req.user!._id;
    if (q.status) filter.status = q.status;
    if (q.intent) filter.intent = q.intent;
    if (q.source) filter.source = q.source;
    if (q.minScore) filter.leadScore = { $gte: Number(q.minScore) };
    if (q.temperature) filter.leadTemperature = q.temperature;
    if (q.search) {
      filter.$or = [{ name: { $regex: q.search, $options: 'i' } }, { phone: { $regex: q.search, $options: 'i' } }];
    }

    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));
    const [items, total] = await Promise.all([
      Lead.find(filter)
        .sort({ leadScore: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('customerId', 'name email phone')
        .populate('assignedAgent', 'name'),
      Lead.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function getLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('assignedAgent', 'name email')
      .populate('interestedProperties', 'title price locality city');
    if (!lead) throw new ApiError(404, 'Lead not found', 'NOT_FOUND');
    if (req.user!.role === 'CUSTOMER' && String(lead.customerId._id ?? lead.customerId) !== req.user!._id) {
      throw new ApiError(403, 'Not your lead', 'FORBIDDEN');
    }

    const nextAction = recommendedNextAction(lead);
    const { score, reasons } = computeLeadScore(lead);
    res.json({ lead, nextAction, scoreBreakdown: { score, reasons }, temperature: temperatureFor(score) });
  } catch (err) {
    next(err);
  }
}

export async function createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    if (!body.name) throw new ApiError(400, 'Name is required', 'VALIDATION_ERROR');
    const lead = await Lead.create({
      ...body,
      customerId: body.customerId ?? req.user!._id,
      source: body.source ?? 'WEBSITE',
    });
    await Activity.create({ type: 'LEAD_CREATED', leadId: lead._id, customerId: lead.customerId, description: `Lead created manually by ${req.user!.name}` });
    const updated = await rescoreLead(String(lead._id));
    res.status(201).json({ lead: updated ?? lead });
  } catch (err) {
    next(err);
  }
}

export async function updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const allowed = [
      'status', 'assignedAgent', 'intent', 'propertyType', 'preferredLocations', 'budgetMin',
      'budgetMax', 'timeline', 'requirements', 'phone', 'nextFollowUpAt', 'sentiment',
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in (req.body as Record<string, unknown>)) updates[key] = (req.body as Record<string, unknown>)[key];
    }
    const lead = await Lead.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!lead) throw new ApiError(404, 'Lead not found', 'NOT_FOUND');
    if (updates.assignedAgent) {
      await Activity.create({ type: 'LEAD_ASSIGNED', leadId: lead._id, description: `Lead assigned` });
    }
    if (updates.status) {
      await Activity.create({ type: 'LEAD_STATUS_CHANGED', leadId: lead._id, description: `Status → ${String(updates.status)}` });
    }
    const updated = await rescoreLead(String(lead._id));
    res.json({ lead: updated ?? lead });
  } catch (err) {
    next(err);
  }
}

export async function deleteLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) throw new ApiError(404, 'Lead not found', 'NOT_FOUND');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** POST /api/leads/:id/score — re-run the scoring engine (spec §23-24) */
export async function scoreLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await rescoreLead(req.params.id);
    if (!lead) throw new ApiError(404, 'Lead not found', 'NOT_FOUND');
    const { score, reasons } = computeLeadScore(lead);
    res.json({ lead, score, temperature: temperatureFor(score), reasons, nextAction: recommendedNextAction(lead) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/leads/priorities — staff priority queue (spec §25) */
export async function leadPriorities(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: Record<string, unknown> = {};
    const leads = await Lead.find(filter).sort({ leadScore: -1 }).limit(50)
      .populate('customerId', 'name email phone');
    const buckets: Record<string, typeof leads> = { HIGH: [], MEDIUM: [], LOW: [] };
    for (const lead of leads) {
      if (lead.leadScore >= 80) buckets.HIGH.push(lead);
      else if (lead.leadScore >= 60) buckets.MEDIUM.push(lead);
      else buckets.LOW.push(lead);
    }
    res.json({ buckets });
  } catch (err) {
    next(err);
  }
}
