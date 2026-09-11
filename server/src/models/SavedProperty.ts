import mongoose, { Schema } from 'mongoose';

const SavedPropertySchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  },
  { timestamps: true, collection: 'saved_properties' },
);

SavedPropertySchema.index({ customerId: 1, propertyId: 1 }, { unique: true });

export const SavedProperty = mongoose.model('SavedProperty', SavedPropertySchema);
