import mongoose, { Schema } from 'mongoose';

const MessageSchema = new Schema(
  {
    senderType: { type: String, enum: ['CUSTOMER', 'AGENT', 'AI'], required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    metadata: Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true },
);

const ConversationSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: 'User' },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    title: { type: String, default: 'Property search' },
    messages: { type: [MessageSchema], default: [] },
    summary: {
      requirement: String,
      budget: String,
      location: String,
      timeline: String,
      preferences: { type: [String], default: [] },
      intent: String,
      nextAction: String,
    },
    detectedIntent: String,
    sentiment: { type: String, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'], default: 'NEUTRAL' },
    extractedRequirements: {
      propertyType: String,
      locations: { type: [String], default: [] },
      budgetMin: Number,
      budgetMax: Number,
      amenities: { type: [String], default: [] },
    },
  },
  { timestamps: true, collection: 'conversations' },
);

export const Conversation = mongoose.model('Conversation', ConversationSchema);
