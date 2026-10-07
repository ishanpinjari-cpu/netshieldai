import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  threatName: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  affectedDevice: { type: String },
  recommendedAction: { type: String },
  status: { type: String, enum: ['active', 'investigating', 'mitigated', 'resolved'], default: 'active' },
  read: { type: Boolean, default: false },
  riskScore: { type: Number, default: 0 },
  srcIP: { type: String },
  dstIP: { type: String },
  description: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

alertSchema.index({ severity: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ createdAt: -1 });

export default mongoose.model('Alert', alertSchema);
