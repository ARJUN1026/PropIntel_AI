import mongoose, { Schema } from 'mongoose';

const PropertySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    propertyType: { type: String, enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'PLOT', 'VILLA', 'OFFICE'], required: true },
    listingType: { type: String, enum: ['BUY', 'RENT'], default: 'BUY' },
    price: { type: Number, required: true, index: true }, // whole rupees
    city: { type: String, required: true, trim: true, index: true },
    locality: { type: String, required: true, trim: true, index: true },
    location: { type: String, default: '' },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    bedrooms: { type: Number, default: 0, index: true },
    bathrooms: { type: Number, default: 0 },
    carpetArea: { type: Number, default: 0 },
    builtUpArea: Number,
    parking: { type: Boolean, default: false },
    furnishing: { type: String, enum: ['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'], default: 'UNFURNISHED' },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    developer: String,
    possessionDate: String,
    status: { type: String, enum: ['DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'UNAVAILABLE', 'ARCHIVED'], default: 'AVAILABLE', index: true },
    assignedAgent: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'properties' },
);

export const Property = mongoose.model('Property', PropertySchema);
