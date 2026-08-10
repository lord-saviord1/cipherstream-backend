import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Sports', 'Shows & Movies', 'Music', 'Anime', 'News', 'Lifestyle'],
    },
    tier: { type: String, required: true, enum: ['free', 'individual', 'business'], default: 'individual' },
    bundleId: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    streamUrl: { type: String, required: true },
    sourceGroup: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Channel || mongoose.model('Channel', channelSchema);
