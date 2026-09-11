import type { Request, Response, NextFunction } from 'express';
import { SavedProperty } from '../models/SavedProperty.js';
import { Property } from '../models/Property.js';
import { Activity } from '../models/Activity.js';
import { ApiError } from '../middleware/error.js';

/** GET /api/saved — customer's saved properties */
export async function listSaved(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const saved = await SavedProperty.find({ customerId: req.user!._id }).sort({ createdAt: -1 });
    const propertyIds = saved.map(s => s.propertyId);
    const properties = await Property.find({ _id: { $in: propertyIds } });
    res.json({ items: properties });
  } catch (err) {
    next(err);
  }
}

/** POST /api/saved/:propertyId */
export async function saveProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const propertyId = req.params.propertyId;
    const property = await Property.findById(propertyId);
    if (!property) throw new ApiError(404, 'Property not found', 'NOT_FOUND');
    await SavedProperty.findOneAndUpdate(
      { customerId: req.user!._id, propertyId },
      { customerId: req.user!._id, propertyId },
      { upsert: true, new: true },
    );
    await Activity.create({ type: 'PROPERTY_SAVED', actorId: req.user!._id, customerId: req.user!._id, propertyId, description: `Saved ${property.title}` });
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/saved/:propertyId */
export async function unsaveProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await SavedProperty.findOneAndDelete({ customerId: req.user!._id, propertyId: req.params.propertyId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
