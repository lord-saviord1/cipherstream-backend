import mongoose from 'mongoose';
const bundleSchema = new mongoose.Schema({
  bundleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  priceIndividual: { type: Number, required: true },
  priceBusinessMonthly: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.models.Bundle || mongoose.model('Bundle', bundleSchema);
