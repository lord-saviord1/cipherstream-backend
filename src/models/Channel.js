import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true },
    channelNumber: { type: Number }, // DStv-style number, only meaningful for live
    category: {
      type: String,
      required: true,
      enum: ['Movies', 'Series', 'Entertainment', 'Animation', 'Kids', 'Comedy', 'Music', 'Sports', 'News', 'Lifestyle', 'General'],
    },
    contentType: { type: String, required: true, enum: ['live', 'ondemand'], default: 'live' },
    tier: { type: String, required: true, enum: ['free', 'individual', 'business'], default: 'individual' },
    bundleId: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    poster: { type: String, default: '' },
    streamUrl: { type: String, required: true },
    sourceGroup: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Channel || mongoose.model('Channel', channelSchema);
