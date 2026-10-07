import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  type: { type: String, enum: ['packet', 'user', 'login', 'prediction', 'alert', 'system'], required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  level: { type: String, enum: ['info', 'warning', 'error', 'critical'], default: 'info' },
}, { timestamps: true });

logSchema.index({ type: 1 });
logSchema.index({ createdAt: -1 });

export default mongoose.model('Log', logSchema);
