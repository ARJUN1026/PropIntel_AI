import type { Request, Response, NextFunction } from 'express';
import { SiteVisit } from '../models/SiteVisit.js';
import { Property } from '../models/Property.js';
import { Lead } from '../models/Lead.js';
import { Activity } from '../models/Activity.js';
import { rescoreLead } from '../services/lead/leadScoring.js';
import { ApiError } from '../middleware/error.js';

/** GET /api/site-visits — role-scoped */
export async function listVisits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: Record<string, unknown> = {};
    if (req.user!.role === 'CUSTOMER') filter.customerId = req.user!._id;
    const items = await SiteVisit.find(filter)
      .sort({ date: 1 })
      .populate('propertyId', 'title locality city images price')
      .populate('customerId', 'name phone email');
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

/** POST /api/site-visits — customer requests a visit (spec §35-36) */
export async function requestVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { propertyId, date, time, notes } = req.body as Record<string, string>;
    if (!propertyId || !date || !time) {
      throw new ApiError(400, 'propertyId, date and time are required', 'VALIDATION_ERROR');
    }
    const property = await Property.findById(propertyId);
    if (!property) throw new ApiError(404, 'Property not found', 'NOT_FOUND');

    // attach to the customer's most recent open lead if any
    const lead = await Lead.findOne({ customerId: req.user!._id, status: { $in: ['NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP'] } }).sort({ createdAt: -1 });

    const visit = await SiteVisit.create({
      customerId: req.user!._id,
      propertyId,
      leadId: lead?._id,
      agentId: property.assignedAgent,
      date,
      time,
      notes,
      status: 'REQUESTED',
    });

    if (lead) {
      lead.status = 'SITE_VISIT';
      await lead.save();
      await rescoreLead(String(lead._id));
    }
    await Activity.create({
      type: 'SITE_VISIT_REQUESTED',
      actorId: req.user!._id,
      customerId: req.user!._id,
      propertyId,
      leadId: lead?._id,
      description: `Site visit requested for ${property.title} on ${date} ${time}`,
    });
    res.status(201).json({ visit });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/site-visits/:id — agent/admin confirm, reschedule, complete (spec §36) */
export async function updateVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, date, time, notes, outcome } = req.body as Record<string, string>;
    const visit = await SiteVisit.findById(req.params.id);
    if (!visit) throw new ApiError(404, 'Site visit not found', 'NOT_FOUND');
    if (status) visit.status = status as typeof visit.status;
    if (date) visit.date = date;
    if (time) visit.time = time;
    if (notes !== undefined) visit.notes = notes;
    if (outcome !== undefined) visit.outcome = outcome;
    await visit.save();
    await Activity.create({ type: 'SITE_VISIT_UPDATED', actorId: req.user!._id, propertyId: String(visit.propertyId), description: `Site visit ${status ?? 'updated'} (${visit.date} ${visit.time})` });
    res.json({ visit });
  } catch (err) {
    next(err);
  }
}

export async function deleteVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const visit = await SiteVisit.findByIdAndDelete(req.params.id);
    if (!visit) throw new ApiError(404, 'Site visit not found', 'NOT_FOUND');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
