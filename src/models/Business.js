import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const businessSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true },
    contactEmail: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    address: { type: String, default: '' },
    bankAccountNumber: { type: String },
    bankCode: { type: String },
    verifiedAccountName: { type: String },
    kycVerified: { type: Boolean, default: false },
    monnifyAccountReference: { type: String },
    monnifyAccountNumber: { type: String },
    monnifyBankName: { type: String },
    subscriptionActive: { type: Boolean, default: false },
    subscriptionBundles: [{ type: String }],
    currentBillingPeriodEnd: { type: Date },
    dataPartnerAddonRequested: { type: Boolean, default: false },
  },
  { timestamps: true }
);

businessSchema.methods.setPassword = async function (plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, 10);
};
businessSchema.methods.checkPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

export default mongoose.models.Business || mongoose.model('Business', businessSchema);
