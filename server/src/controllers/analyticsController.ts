import type { Request, Response, NextFunction } from 'express';
import { Lead } from '../models/Lead.js';
import { Property } from '../models/Property.js';
import { User } from '../models/User.js';
import { SiteVisit } from '../models/SiteVisit.js';

interface QueryShape {
  status?: { $in: string[] } | string;
  createdAt?: { $gte?: Date; $lte?: Date };
  leadScore?: { $gte: number };
}

/**
 * Analytics endpoints (spec §45-50). All numbers are computed with MongoDB
 * aggregation pipelines over live collections.
 */

/** GET /api/analytics/overview — admin/agent headline stats */
export async function overview(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [properties, customers, agents, leads, hotLeads, visits, conversions] = await Promise.all([
      Property.countDocuments(),
      User.countDocuments({ role: 'CUSTOMER' }),
      User.countDocuments({ role: 'ADMIN' }),
      Lead.countDocuments(),
      Lead.countDocuments({ leadTemperature: 'HOT' }),
      SiteVisit.countDocuments(),
      Lead.countDocuments({ status: 'CONVERTED' }),
    ]);
    const conversionRate = leads > 0 ? Math.round((conversions / leads) * 1000) / 10 : 0;
    res.json({ properties, customers, agents, leads, hotLeads, visits, conversions, conversionRate });
  } catch (err) {
    next(err);
  }
}

/** GET /api/analytics/leads — funnel + status distribution (spec §48) */
export async function leadAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const byStatus = await Lead.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byTemperature = await Lead.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$leadTemperature', count: { $sum: 1 } } },
    ]);
    const funnelStages = ['NEW', 'QUALIFIED', 'SITE_VISIT', 'NEGOTIATION', 'CONVERTED'];
    const funnel = funnelStages.map(stage => ({
      stage,
      count: byStatus.find(s => s._id === stage)?.count ?? 0,
    }));
    res.json({ byStatus, byTemperature, funnel });
  } catch (err) {
    next(err);
  }
}

/** GET /api/analytics/properties — demand by city/type (spec §43) */
export async function propertyAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const byCity = await Property.aggregate<{ _id: string; count: number; avgPrice: number }>([
      { $match: { status: { $ne: 'ARCHIVED' } } },
      { $group: { _id: '$city', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const byType = await Property.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$propertyType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ byCity, byType });
  } catch (err) {
    next(err);
  }
}

/** GET /api/analytics/agents — agent performance (spec §47) */
export async function agentAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const agents = await User.find({ role: 'ADMIN' }).select('name email');
    const rows = await Promise.all(
      agents.map(async agent => {
        const [leads, qualified, visits, conversions] = await Promise.all([
          Lead.countDocuments({ assignedAgent: agent._id }),
          Lead.countDocuments({ assignedAgent: agent._id, status: { $in: ['QUALIFIED', 'FOLLOW_UP', 'SITE_VISIT', 'NEGOTIATION', 'CONVERTED'] } }),
          SiteVisit.countDocuments({ agentId: agent._id }),
          Lead.countDocuments({ assignedAgent: agent._id, status: 'CONVERTED' }),
        ]);
        return {
          agentId: agent._id,
          name: agent.name,
          email: agent.email,
          leads,
          qualified,
          visits,
          conversions,
          conversionRate: leads > 0 ? Math.round((conversions / leads) * 1000) / 10 : 0,
        };
      }),
    );
    rows.sort((a, b) => b.conversionRate - a.conversionRate);
    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
}

/** GET /api/analytics/campaigns — lead source performance (spec §45-46) */
export async function campaignAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bySource = await Lead.aggregate<{ _id: string; leads: number; qualified: number; converted: number }>([
      {
        $group: {
          _id: '$source',
          leads: { $sum: 1 },
          qualified: { $sum: { $cond: [{ $in: ['$status', ['QUALIFIED', 'FOLLOW_UP', 'SITE_VISIT', 'NEGOTIATION', 'CONVERTED']] }, 1, 0] } },
          converted: { $sum: { $cond: [{ $eq: ['$status', 'CONVERTED'] }, 1, 0] } },
        },
      },
      { $sort: { leads: -1 } },
    ]);
    const rows = bySource.map(s => ({
      source: s._id,
      leads: s.leads,
      qualified: s.qualified,
      converted: s.converted,
      conversionRate: s.leads > 0 ? Math.round((s.converted / s.leads) * 1000) / 10 : 0,
    }));
    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
}

/** GET /api/analytics/demand — most requested locations/types from leads (spec §43) */
export async function demandAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locations = await Lead.aggregate<{ _id: string; count: number }>([
      { $unwind: '$preferredLocations' },
      { $group: { _id: '$preferredLocations', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const types = await Lead.aggregate<{ _id: string; count: number }>([
      { $match: { propertyType: { $nin: [null, ''] } } },
      { $group: { _id: '$propertyType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const budgets = await Lead.aggregate<{ _id: string; count: number }>([
      {
        $match: { budgetMax: { $gt: 0 } },
      },
      {
        $bucket: {
          groupBy: '$budgetMax',
          boundaries: [0, 5_000_000, 7_500_000, 10_000_000, 20_000_000, 100_000_000],
          default: '2Cr+',
          output: { count: { $sum: 1 } },
        },
      },
      {
        $project: {
          label: {
            $switch: {
              branches: [
                { case: { $lt: ['$_id', 5_000_000] }, then: '0-50L' },
                { case: { $lt: ['$_id', 7_500_000] }, then: '50-75L' },
                { case: { $lt: ['$_id', 10_000_000] }, then: '75L-1Cr' },
                { case: { $lt: ['$_id', 20_000_000] }, then: '1-2Cr' },
              ],
              default: '2Cr+',
            },
          },
          count: 1,
        },
      },
      { $sort: { label: 1 } },
    ]);
    res.json({ locations, types, budgets });
  } catch (err) {
    next(err);
  }
}

export type { QueryShape };
