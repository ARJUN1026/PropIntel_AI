import mongoose, { Schema } from 'mongoose';

const ActivitySchema = new Schema(
  {
    type: { type: String, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    description: { type: String, required: true },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true, collection: 'activities' },
);

export const Activity = mongoose.model('Activity', ActivitySchema);
