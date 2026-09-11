import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '', trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['CUSTOMER', 'ADMIN'], default: 'CUSTOMER' },
    avatar: String,
    preferences: Schema.Types.Mixed,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'users' },
);

export const User = mongoose.model('User', UserSchema);
