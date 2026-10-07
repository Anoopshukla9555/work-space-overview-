import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: String,
  googleId: String,
  avatar: String,
  emailVerified: { type: Boolean, default: false },
  purposes: { type: [String], default: [] },
  onboarded: { type: Boolean, default: false },
  tokenHash: String, tokenType: String, tokenExpires: Date,
  storageUsed: { type: Number, default: 0 },
  storageLimit: { type: Number, default: 1024 ** 3 }
}, { timestamps: true });
export default mongoose.model('User', schema);
