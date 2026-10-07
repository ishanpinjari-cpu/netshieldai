import mongoose from 'mongoose';

const threatSchema = new mongoose.Schema({
  attackType: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  mitreTechnique: { type: String },
  mitreId: { type: String },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  mitigation: { type: String },
  prevention: { type: String },
  indicators: [{ type: String }],
}, { timestamps: true });

threatSchema.index({ attackType: 'text', description: 'text' });

export default mongoose.model('Threat', threatSchema);
