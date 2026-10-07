import mongoose from 'mongoose';

const packetSchema = new mongoose.Schema({
  srcIP: { type: String, required: true },
  dstIP: { type: String, required: true },
  srcPort: { type: Number },
  dstPort: { type: Number },
  protocol: { type: String, required: true },
  size: { type: Number },
  ttl: { type: Number },
  flags: { type: String },
  payload: { type: String },
  prediction: { type: String, default: 'Normal' },
  confidence: { type: Number, default: 0 },
  riskScore: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  modelUsed: { type: String },
}, { timestamps: true });

packetSchema.index({ srcIP: 1 });
packetSchema.index({ dstIP: 1 });
packetSchema.index({ protocol: 1 });
packetSchema.index({ createdAt: -1 });

export default mongoose.model('Packet', packetSchema);
