import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  hostname: { type: String, required: true },
  mac: { type: String, required: true, unique: true },
  ip: { type: String, required: true },
  os: { type: String },
  type: { type: String, enum: ['server', 'desktop', 'mobile', 'router', 'iot', 'other'], default: 'other' },
  online: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  securityStatus: { type: String, enum: ['secure', 'warning', 'critical'], default: 'secure' },
}, { timestamps: true });

export default mongoose.model('Device', deviceSchema);
