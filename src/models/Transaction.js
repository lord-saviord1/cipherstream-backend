import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    paymentReference: { type: String, required: true, unique: true },
    transactionReference: { type: String },
    accountType: { type: String, enum: ['user', 'business'], required: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'accountModelName' },
    accountModelName: { type: String, enum: ['User', 'Business'], required: true },
    bundleId: { type: String, required: true },
    amount: { type: Number, required: true },
    purpose: { type: String, enum: ['individual_unlock', 'business_subscription_payment'], required: true },
    status: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'OVERPAID', 'PARTIALLY_PAID'], default: 'PENDING' },
    rawWebhookPayload: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
