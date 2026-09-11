import mongoose, { Schema } from 'mongoose';

const SiteVisitSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ['REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'REQUESTED',
      index: true,
    },
    notes: String,
    outcome: String,
  },
  { timestamps: true, collection: 'site_visits' },
);

export const SiteVisit = mongoose.model('SiteVisit', SiteVisitSchema);
